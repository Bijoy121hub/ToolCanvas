document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Percentage
    const p1x = document.getElementById('p1-x'), p1y = document.getElementById('p1-y'), p1r = document.getElementById('p1-result');
    const p2x = document.getElementById('p2-x'), p2y = document.getElementById('p2-y'), p2r = document.getElementById('p2-result');
    const p3x = document.getElementById('p3-x'), p3y = document.getElementById('p3-y'), p3r = document.getElementById('p3-result');

    const updateP = () => {
        p1r.textContent = (Number(p1x.value) * Number(p1y.value) / 100).toLocaleString();
        let p2v = (Number(p2x.value) / Number(p2y.value)) * 100;
        p2r.textContent = (isNaN(p2v) || !isFinite(p2v) ? 0 : p2v).toLocaleString() + '%';
        let p3v = Number(p3x.value) / (Number(p3y.value) / 100);
        p3r.textContent = (isNaN(p3v) || !isFinite(p3v) ? 0 : p3v).toLocaleString();
    };
    [p1x, p1y, p2x, p2y, p3x, p3y].forEach(el => el.addEventListener('input', updateP));
    updateP();

    // Discount
    const dp = document.getElementById('d-price'), dd = document.getElementById('d-discount'), dt = document.getElementById('d-tax');
    const dfp = document.getElementById('d-final-price'), ds = document.getElementById('d-savings'), db = document.getElementById('d-bar');

    const updateD = () => {
        let price = Math.max(0, Number(dp.value));
        let discount = Math.max(0, Math.min(100, Number(dd.value)));
        let tax = Math.max(0, Number(dt.value));

        let discAmt = price * (discount / 100);
        let afterDisc = price - discAmt;
        let finalPrice = afterDisc + (afterDisc * (tax / 100));

        dfp.textContent = finalPrice.toFixed(2);
        ds.textContent = discAmt.toFixed(2);
        db.style.width = price > 0 ? ((afterDisc / price) * 100) + '%' : '0%';
    };
    [dp, dd, dt].forEach(el => el.addEventListener('input', updateD));
    updateD();

    // Change
    const cf = document.getElementById('c-from'), ct = document.getElementById('c-to'), cr = document.getElementById('c-result'), cd = document.getElementById('c-diff');
    
    const updateC = () => {
        let from = Number(cf.value), to = Number(ct.value);
        let diff = to - from;
        let pct = from !== 0 ? (diff / Math.abs(from)) * 100 : 0;
        
        cd.textContent = Math.abs(diff).toLocaleString();
        if (pct >= 0) {
            cr.textContent = `+${pct.toFixed(2)}% (Increase) ⬆️`;
            cr.style.color = '#10b981';
        } else {
            cr.textContent = `${pct.toFixed(2)}% (Decrease) ⬇️`;
            cr.style.color = '#ef4444';
        }
    };
    [cf, ct].forEach(el => el.addEventListener('input', updateC));
    updateC();

    // Tip
    const tb = document.getElementById('t-bill'), tc = document.getElementById('t-custom'), tp = document.getElementById('t-people');
    const tta = document.getElementById('t-tip-amt'), tt = document.getElementById('t-total'), tpp = document.getElementById('t-person');
    const tipBtns = document.querySelectorAll('.tip-btn');

    tipBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tipBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tc.value = btn.dataset.val;
            updateT();
        });
    });

    const updateT = () => {
        let bill = Math.max(0, Number(tb.value));
        let tipPct = Math.max(0, Number(tc.value));
        let people = Math.max(1, Number(tp.value));

        let tipAmt = bill * (tipPct / 100);
        let total = bill + tipAmt;
        let perPerson = total / people;

        tta.textContent = tipAmt.toFixed(2);
        tt.textContent = total.toFixed(2);
        tpp.textContent = perPerson.toFixed(2);
    };
    [tb, tc, tp].forEach(el => el.addEventListener('input', updateT));
    updateT();
});
