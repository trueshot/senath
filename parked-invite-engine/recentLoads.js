// recentLoads.js — recent loads for a company from ORDHEAD.DBF, for invitation
// copy and channel diagnostics. OWNER: senath (billet senathSendEmail).
//
// CONTRACT (ratified with denver 2026-07-24, field reliability MEASURED):
//   getRecentLoads(companyId, opts, cb) -> cb(null, {ok:true, loads:[...]})
//                                       or cb(null, {ok:false, error:'...'})
//   loads = [{loadNumber, shipDate, orderDate}], newest first, max opts.max (3).
//   shipDate / orderDate are ISO 'YYYY-MM-DD' or null.
//   *** NEVER THROWS, NEVER PASSES err. A DBF hiccup must not block a send.
//       ok:false is the EXPLICIT failure signal; the caller maps it to
//       templateData.recentLoads = undefined (lookup-failed), which must never
//       be confused with ok:true + loads:[] (VERIFIED zero). ***
//
// MEASURED FIELD RELIABILITY (5291 recent rows, 2026-07-24 — do not re-derive):
//   SHIP_DATE  50% populated AND IS A SCHEDULED DATE (future values observed).
//              A past-tense "went out" claim requires shipDate != null AND
//              shipDate <= today. The consumer enforces tense; we just report.
//   ORDER_DATE 99.7% populated — the reliable date.
//   DEL_DATE   0% — never use.
//   ADDRESS3   contains junk ('55', 'G2206...') — destination NOT in contract.
//
// Reads the TAIL of dbf/ordhead.dbf (local to the dataset working dir on the
// prey). 97k+ records — never scan the whole file. Node 5.12 safe.
//
// Author: senath gen-11 — 2026-07-24

var fs = require('fs');

function dbfDateToIso(s) {
    s = String(s || '').trim();
    if (!/^\d{8}$/.test(s)) return null;
    return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
}

function getRecentLoads(companyId, opts, cb) {
    if (typeof opts === 'function') { cb = opts; opts = {}; }
    opts = opts || {};
    var dbfPath = opts.dbfPath || 'dbf/ordhead.dbf';
    var TAIL = opts.tailRecords || 6000;
    var MAX = opts.max || 3;
    var fd;
    try {
        var target = String(companyId || '').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
        if (!target) return cb(null, { ok: false, error: 'no companyId' });
        if (!fs.existsSync(dbfPath)) return cb(null, { ok: false, error: 'no ' + dbfPath });

        fd = fs.openSync(dbfPath, 'r');
        var head = Buffer.alloc(32);
        fs.readSync(fd, head, 0, 32, 0);
        var recCount = head.readUInt32LE(4);
        var headerLen = head.readUInt16LE(8);
        var recLen = head.readUInt16LE(10);
        var nFields = Math.floor((headerLen - 33) / 32);
        var fdesc = Buffer.alloc(32 * nFields);
        fs.readSync(fd, fdesc, 0, fdesc.length, 32);

        var off = 1, F = {};
        for (var i = 0; i < nFields; i++) {
            var b = fdesc.slice(i * 32, i * 32 + 32);
            var nm = b.slice(0, 11).toString('ascii').replace(/[^A-Za-z0-9_][\s\S]*$/, '');
            F[nm] = { off: off, w: b[16] };
            off += b[16];
        }
        // structure gates — a wrong offset reads garbage; fail explicit, never guess
        if (off !== recLen) { fs.closeSync(fd); return cb(null, { ok: false, error: 'reclen mismatch ' + off + '/' + recLen }); }
        if (!F.ID_NO || !F.INVCE_NO) { fs.closeSync(fd); return cb(null, { ok: false, error: 'ID_NO/INVCE_NO not found' }); }

        function fld(rec, n) {
            var x = F[n];
            if (!x) return '';
            return rec.slice(x.off, x.off + x.w).toString('ascii').trim();
        }

        var start = recCount > TAIL ? recCount - TAIL : 0;
        var rec = Buffer.alloc(recLen);
        var seen = {}, found = [];
        // walk the tail BACKWARDS: physical order is append order, so the first
        // matches walking backwards are the newest. Dedupe by load+deal.
        for (var r = recCount - 1; r >= start; r--) {
            fs.readSync(fd, rec, 0, recLen, headerLen + r * recLen);
            if (rec[0] === 0x2A) continue;                        // deleted
            var id = fld(rec, 'ID_NO').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
            if (id !== target) continue;
            var load = fld(rec, 'INVCE_NO');
            if (!load) continue;
            var key = load + '|' + fld(rec, 'ABC');
            if (seen[key]) continue;
            seen[key] = true;
            found.push({
                loadNumber: load,
                shipDate: dbfDateToIso(fld(rec, 'SHIP_DATE')),
                orderDate: dbfDateToIso(fld(rec, 'ORDER_DATE'))
            });
            if (found.length >= MAX) break;
        }
        fs.closeSync(fd);
        return cb(null, { ok: true, loads: found });
    } catch (e) {
        if (fd !== undefined) { try { fs.closeSync(fd); } catch (x) {} }
        return cb(null, { ok: false, error: e.message });
    }
}

module.exports = { getRecentLoads: getRecentLoads, dbfDateToIso: dbfDateToIso };
