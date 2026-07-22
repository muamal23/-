let appData = {
    current: null, 
    history: [],
    trash: [] // سلة المهملات
};

let todayStrGlobal = null; 

document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupTodayHeader();
    checkAppStatus();
});

function setupTodayHeader() {
    const today = new Date();
    const optionsDay = { weekday: 'long' };
    const optionsDate = { day: 'numeric', month: 'numeric', year: 'numeric' };
    
    document.getElementById("today-day-name").innerText = today.toLocaleDateString('ar-IQ', optionsDay);
    document.getElementById("today-full-date").innerText = today.toLocaleDateString('ar-IQ', optionsDate);
    
    todayStrGlobal = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
}

function loadData() {
    const saved = localStorage.getItem("breadAppStorage_v5");
    if (saved) {
        appData = JSON.parse(saved);
    }
    // تهيئة سلة المهملات إن لم تكن موجودة في البيانات القديمة
    if (!appData.trash) {
        appData.trash = [];
    }
}

function saveData() {
    localStorage.setItem("breadAppStorage_v5", JSON.stringify(appData));
}

function checkAppStatus() {
    if (!appData.current) {
        document.getElementById("setup-section").classList.remove("hidden");
        document.getElementById("main-dashboard").classList.add("hidden");
    } else {
        document.getElementById("setup-section").classList.add("hidden");
        document.getElementById("main-dashboard").classList.remove("hidden");
        updateDashboard();
    }
}

function createNewSchedule() {
    const start = document.getElementById("start-date").value;
    const total = parseInt(document.getElementById("total-bread-input").value);

    if (!start || isNaN(total) || total <= 0) {
        alert("يرجى إدخال تاريخ البداية والعدد الكلي بشكل صحيح!");
        return;
    }

    appData.current = {
        id: Date.now(),
        startDate: start,
        totalBread: total,
        moneyPaid: false,
        flourDelivered: false,
        daysRecord: {}
    };

    saveData();
    checkAppStatus();
}

function updateDashboard() {
    if (!appData.current) return;

    let consumed = 0;
    for (const date in appData.current.daysRecord) {
        if (appData.current.daysRecord[date].bought) {
            consumed += appData.current.daysRecord[date].amount;
        }
    }
    const remaining = appData.current.totalBread - consumed;
    
    document.getElementById("total-bread").innerText = appData.current.totalBread;
    const remainingEl = document.getElementById("remaining-bread");
    remainingEl.innerText = remaining;

    if (remaining <= 0) {
        remainingEl.style.color = "var(--apple-red)";
    } else if (remaining < (appData.current.totalBread * 0.2)) {
        remainingEl.style.color = "var(--apple-red)";
    } else if (remaining < (appData.current.totalBread * 0.5)) {
        remainingEl.style.color = "var(--apple-orange)";
    } else {
        remainingEl.style.color = "var(--apple-green)";
    }

    document.getElementById("money-toggle").checked = appData.current.moneyPaid;
    document.getElementById("flour-toggle").checked = appData.current.flourDelivered;
    updateSubscriptionText();

    updateRecordingUI();
}

function updateSubscription() {
    appData.current.moneyPaid = document.getElementById("money-toggle").checked;
    appData.current.flourDelivered = document.getElementById("flour-toggle").checked;
    saveData();
    updateSubscriptionText();
}

function updateSubscriptionText() {
    const moneyLabel = document.getElementById("money-label");
    const flourLabel = document.getElementById("flour-label");

    if (appData.current.moneyPaid) {
        moneyLabel.innerText = "فلوس الاشتراك (واصل)";
        moneyLabel.style.color = "var(--apple-green)";
    } else {
        moneyLabel.innerText = "فلوس الاشتراك (غير واصل)";
        moneyLabel.style.color = "var(--apple-red)";
    }

    if (appData.current.flourDelivered) {
        flourLabel.innerText = "الطحين (واصل)";
        flourLabel.style.color = "var(--apple-green)";
    } else {
        flourLabel.innerText = "الطحين (غير واصل)";
        flourLabel.style.color = "var(--apple-red)";
    }
}

function updateRecordingUI() {
    const titleEl = document.getElementById("record-card-title");
    const btnBuy = document.getElementById("btn-record-buy");
    const btnEmpty = document.getElementById("btn-record-empty");
    const todayObj = new Date();
    const dayName = todayObj.toLocaleDateString('ar-IQ', { weekday: 'long' });

    if (todayStrGlobal < appData.current.startDate) {
        titleEl.innerText = "الجدول لم يبدأ بعد!";
        disableInputs(true);
    } else if (appData.current.daysRecord[todayStrGlobal]) {
        titleEl.innerText = `🎉 تم تسجيل خبز اليوم (${dayName})`;
        disableInputs(true);
    } else {
        titleEl.innerText = `تسجيل خبز اليوم (${dayName})`;
        disableInputs(false);
    }

    let missedDateStr = null;
    let d = new Date(appData.current.startDate);
    const yesterday = new Date(todayObj);
    yesterday.setDate(yesterday.getDate() - 1);

    while (d <= yesterday) {
        const dStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
        if (!appData.current.daysRecord[dStr]) {
            missedDateStr = dStr;
            break; 
        }
        d.setDate(d.getDate() + 1);
    }

    const warning = document.getElementById("missing-days-warning");
    if (missedDateStr) {
        const parts = missedDateStr.split("-");
        const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        const mDayName = dateObj.toLocaleDateString('ar-IQ', { weekday: 'long' });
        
        warning.innerHTML = `
            <div>⚠️ نسيت تسجيل يوم (${mDayName} ${dateObj.getMonth()+1}/${dateObj.getDate()})</div>
            <button class="btn-save-sm" style="background:white; color:var(--apple-red); border:1px solid var(--apple-red);" onclick="toggleTable()">تسجيل الآن</button>
        `;
        warning.style.backgroundColor = "#ffe5e5";
        warning.style.color = "var(--apple-red)";
        warning.classList.remove("hidden");
    } else {
        warning.classList.add("hidden");
    }
}

function disableInputs(disabled) {
    document.getElementById("daily-amount").disabled = disabled;
    document.getElementById("daily-meal").disabled = disabled;
    document.getElementById("btn-record-buy").style.display = disabled ? "none" : "block";
    document.getElementById("btn-record-empty").style.display = disabled ? "none" : "block";
}

function recordToday(didBuy) {
    if (didBuy) {
        const amount = parseInt(document.getElementById("daily-amount").value);
        const meal = document.getElementById("daily-meal").value;
        if (isNaN(amount) || amount <= 0) {
            alert("يرجى إدخال عدد صحيح للخبز!");
            return;
        }
        appData.current.daysRecord[todayStrGlobal] = { bought: true, amount: amount, meal: meal };
        document.getElementById("daily-amount").value = ""; 
    } else {
        appData.current.daysRecord[todayStrGlobal] = { bought: false, amount: 0, meal: "" };
    }

    saveData();
    updateDashboard();
    checkThresholdAndArchive();
}

function savePastDay(dateStr) {
    const amtInput = document.getElementById(`amt-${dateStr}`).value;
    const mealInput = document.getElementById(`meal-${dateStr}`).value;
    const amount = parseInt(amtInput);
    
    if (isNaN(amount) || amount <= 0) {
        alert("أدخل رقماً صحيحاً!");
        return;
    }
    appData.current.daysRecord[dateStr] = { bought: true, amount: amount, meal: mealInput };
    saveData();
    renderCurrentCalendar();
    checkThresholdAndArchive();
}

function savePastDayEmpty(dateStr) {
    appData.current.daysRecord[dateStr] = { bought: false, amount: 0, meal: "" };
    saveData();
    renderCurrentCalendar();
    checkThresholdAndArchive();
}

function checkThresholdAndArchive() {
    setTimeout(() => {
        let consumed = 0;
        for (const date in appData.current.daysRecord) {
            if (appData.current.daysRecord[date].bought) consumed += appData.current.daysRecord[date].amount;
        }
        
        if (consumed >= appData.current.totalBread) {
            archiveCurrentSchedule();
        }
    }, 300);
}

function archiveCurrentSchedule() {
    alert("🍞 اكتمل عدد الخبز الكلي! سيتم حفظ الجدول وتفاصيله في المشتريات السابقة.");
    
    let lastBoughtStr = appData.current.startDate;
    for (const date in appData.current.daysRecord) {
        if (appData.current.daysRecord[date].bought && date > lastBoughtStr) {
            lastBoughtStr = date;
        }
    }

    const d = new Date(lastBoughtStr);
    d.setDate(d.getDate() + 1);
    const nextStartStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');

    appData.history.push(appData.current);
    appData.current = null;
    saveData();

    document.getElementById("table-section").classList.add("hidden");
    document.getElementById("setup-hint").innerText = `اكتمل الجدول السابق. آخر يوم اشتريت فيه كان (${lastBoughtStr}). تم تحديد تاريخ البداية الجديد تلقائياً.`;
    document.getElementById("start-date").value = nextStartStr;
    checkAppStatus();
}

function toggleTable() {
    const tableSection = document.getElementById("table-section");
    if (tableSection.classList.contains("hidden")) {
        renderCurrentCalendar();
        tableSection.classList.remove("hidden");
    } else {
        tableSection.classList.add("hidden");
        updateDashboard(); 
    }
}

function renderCurrentCalendar() {
    const grid = document.getElementById("calendar-grid");
    grid.innerHTML = "";
    if(!appData.current) return;

    const start = new Date(appData.current.startDate);
    const end = new Date(todayStrGlobal); 
    
    let current = new Date(start);

    while (current <= end) {
        const dStr = current.getFullYear() + "-" + String(current.getMonth() + 1).padStart(2, '0') + "-" + String(current.getDate()).padStart(2, '0');
        const displayDate = current.toLocaleDateString('ar-IQ', { weekday: 'short', day: 'numeric', month: 'numeric' });
        const record = appData.current.daysRecord[dStr];
        
        let statusClass = "", statusText = "", contentHtml = "";

        if (record) {
            if (record.bought) {
                statusClass = "status-bought"; statusText = `شراء: ${record.amount} (${record.meal})`;
            } else {
                statusClass = "status-empty"; statusText = "فارغ (لم أشتري)";
            }
            contentHtml = `<div class="day-status">${statusText}</div>
                           <button class="btn-close" onclick="editCurrentDay('${dStr}')" style="font-size:12px; margin-top:5px;">حذف لتعديل اليوم</button>`;
        } else {
            statusClass = "status-missed";
            statusText = "لم يتم التسجيل!";
            contentHtml = `
                <div class="day-status" style="margin-bottom:8px; color: var(--apple-red);">${statusText}</div>
                <div class="edit-controls">
                    <input type="number" id="amt-${dStr}" placeholder="العدد">
                    <select id="meal-${dStr}">
                        <option value="غداء">غداء</option>
                        <option value="عشاء">عشاء</option>
                        <option value="غداء وعشاء">غداء وعشاء</option>
                    </select>
                    <button class="btn-save-sm" onclick="savePastDay('${dStr}')">حفظ</button>
                    <button class="btn-save-sm" style="background:var(--apple-orange);" onclick="savePastDayEmpty('${dStr}')">فارغ</button>
                </div>
            `;
        }

        const card = document.createElement("div");
        card.className = `day-card ${statusClass}`;
        card.innerHTML = `<div class="day-info"><span class="day-date">${displayDate}</span>${contentHtml}</div>`;
        grid.appendChild(card);
        current.setDate(current.getDate() + 1);
    }
}

function editCurrentDay(dateStr) {
    if(confirm("سيتم مسح التسجيل لتتمكن من إدخاله من جديد. هل أنت متأكد؟")) {
        delete appData.current.daysRecord[dateStr];
        saveData();
        renderCurrentCalendar();
    }
}

// ----------------- المشتريات السابقة (History) -----------------
function toggleHistorySection() {
    const historySection = document.getElementById("history-section");
    if (historySection.classList.contains("hidden")) {
        renderHistoryList();
        historySection.classList.remove("hidden");
    } else {
        historySection.classList.add("hidden");
        checkAppStatus(); 
    }
}

function renderHistoryList() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";

    if (appData.history.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--apple-text-muted); margin-top: 20px;">لا توجد جداول مشتريات سابقة.</p>`;
        return;
    }

    const reversedHistory = [...appData.history].reverse();

    reversedHistory.forEach((schedule) => {
        let consumed = 0;
        let lastDate = schedule.startDate;
        for (const date in schedule.daysRecord) {
            if (schedule.daysRecord[date].bought) {
                consumed += schedule.daysRecord[date].amount;
                if (date > lastDate) lastDate = date;
            }
        }

        const moneyStatus = schedule.moneyPaid ? "واصل ✅" : "غير واصل ❌";
        const flourStatus = schedule.flourDelivered ? "واصل ✅" : "غير واصل ❌";

        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="history-header" onclick="toggleHistoryAccordion(this)">
                <h4>من ${schedule.startDate} إلى ${lastDate} <br>
                <span style="font-size:13px; color:var(--apple-text-muted);">الكلي: ${schedule.totalBread} | الفلوس: ${moneyStatus} | الطحين: ${flourStatus}</span></h4>
                <span class="arrow">▼</span>
            </div>
            <div class="history-body hidden">
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${renderHistoryDays(schedule)}
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function toggleHistoryAccordion(headerEl) {
    const item = headerEl.parentElement;
    const body = item.querySelector('.history-body');
    if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        item.classList.add('active');
    } else {
        body.classList.add('hidden');
        item.classList.remove('active');
    }
}

function renderHistoryDays(schedule) {
    let html = "";
    const sortedDates = Object.keys(schedule.daysRecord).sort();
    
    sortedDates.forEach(dateStr => {
        const record = schedule.daysRecord[dateStr];
        const d = new Date(dateStr);
        const displayDate = d.toLocaleDateString('ar-IQ', { weekday: 'short', day: 'numeric', month: 'numeric' });
        
        if (record.bought) {
            html += `<div style="padding:10px; background:#E8F8F0; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold;">${displayDate}</span>
                        <span style="color:var(--apple-green); font-weight:bold; font-size:14px;">${record.amount} (${record.meal})</span>
                     </div>`;
        } else {
            html += `<div style="padding:10px; background:#FFF9E6; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold;">${displayDate}</span>
                        <span style="color:var(--apple-orange); font-size:14px;">فارغ</span>
                     </div>`;
        }
    });

    if(html === "") html = "<p style='text-align:center;'>لا توجد بيانات مسجلة</p>";
    return html;
}

// ----------------- سلة المهملات (Trash) -----------------
function resetApp() {
    if(confirm("هل أنت متأكد من إنهاء وإلغاء الجدول الحالي؟ سيتم نقله إلى سلة المهملات.")) {
        appData.trash.push(appData.current);
        appData.current = null;
        saveData();
        location.reload(); 
    }
}

function toggleTrashSection() {
    const trashSection = document.getElementById("trash-section");
    if (trashSection.classList.contains("hidden")) {
        renderTrashList();
        trashSection.classList.remove("hidden");
    } else {
        trashSection.classList.add("hidden");
        checkAppStatus(); 
    }
}

function renderTrashList() {
    const list = document.getElementById("trash-list");
    list.innerHTML = "";

    if (appData.trash.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:var(--apple-text-muted); margin-top: 20px;">سلة المهملات فارغة.</p>`;
        return;
    }

    const reversedTrash = [...appData.trash].reverse();

    reversedTrash.forEach((schedule) => {
        let consumed = 0;
        for (const date in schedule.daysRecord) {
            if (schedule.daysRecord[date].bought) {
                consumed += schedule.daysRecord[date].amount;
            }
        }

        const moneyStatus = schedule.moneyPaid ? "واصل ✅" : "غير واصل ❌";
        const flourStatus = schedule.flourDelivered ? "واصل ✅" : "غير واصل ❌";

        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="history-header" onclick="toggleHistoryAccordion(this)">
                <h4>جدول محذوف (بدأ ${schedule.startDate}) <br>
                <span style="font-size:13px; color:var(--apple-text-muted);">الكلي: ${schedule.totalBread} | مسجل: ${consumed}</span></h4>
                <span class="arrow">▼</span>
            </div>
            <div class="history-body hidden">
                <p style="font-size:14px; margin-bottom:10px;">حالة الفلوس: ${moneyStatus} <br> حالة الطحين: ${flourStatus}</p>
                <div class="trash-actions">
                    <button class="btn btn-primary" style="flex:1; padding:10px; border-radius:8px;" onclick="restoreFromTrash(${schedule.id})">استعادة الجدول</button>
                    <button class="btn btn-danger" style="flex:1; padding:10px; border-radius:8px; background-color:var(--apple-red);" onclick="permanentDeleteFromTrash(${schedule.id})">حذف نهائي</button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function restoreFromTrash(id) {
    if(appData.current) {
        alert("لا يمكنك استعادة جدول بينما يوجد جدول حالي نشط. قم بإلغاء الجدول الحالي ونقله للمهملات أولاً.");
        return;
    }

    const index = appData.trash.findIndex(t => t.id === id);
    if (index > -1) {
        appData.current = appData.trash[index];
        appData.trash.splice(index, 1);
        saveData();
        alert("تم استعادة الجدول بنجاح بجميع تفاصيله!");
        location.reload();
    }
}

function permanentDeleteFromTrash(id) {
    if(confirm("هل أنت متأكد من حذف هذا الجدول نهائياً؟ لا يمكن التراجع أبداً.")) {
        appData.trash = appData.trash.filter(t => t.id !== id);
        saveData();
        renderTrashList();
    }
}
