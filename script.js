let appData = {
    current: null, 
    history: []    
};

let currentRecordingDateStr = null; 

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
}

function loadData() {
    const saved = localStorage.getItem("breadAppStorage_v3");
    if (saved) {
        appData = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem("breadAppStorage_v3", JSON.stringify(appData));
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
    let current = new Date(appData.current.startDate);
    currentRecordingDateStr = null;

    // حلقة لا نهائية تقف عند أول يوم غير مسجل
    while (true) {
        const dStr = current.getFullYear() + "-" + String(current.getMonth() + 1).padStart(2, '0') + "-" + String(current.getDate()).padStart(2, '0');
        if (!appData.current.daysRecord[dStr]) {
            currentRecordingDateStr = dStr;
            break;
        }
        current.setDate(current.getDate() + 1);
    }

    const titleEl = document.getElementById("record-card-title");
    const warning = document.getElementById("missing-days-warning");
    
    if (currentRecordingDateStr) {
        const parts = currentRecordingDateStr.split("-");
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = d.toLocaleDateString('ar-IQ', { weekday: 'long' });
        const month = d.getMonth() + 1;
        const day = d.getDate();
        
        titleEl.innerText = `تسجيل خبز اليوم (${dayName} ${month}/${day})`;
        document.getElementById("daily-amount").disabled = false;
        document.getElementById("daily-meal").disabled = false;

        const today = new Date();
        const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
        
        if (currentRecordingDateStr < todayStr) {
            warning.classList.remove("hidden");
            warning.innerText = `⚠️ تنبيه: أنت تقوم الآن بتسجيل يوم فائت!`;
        } else {
            warning.classList.add("hidden");
        }
    }
}

function recordToday(didBuy) {
    if (!currentRecordingDateStr) return;

    if (didBuy) {
        const amount = parseInt(document.getElementById("daily-amount").value);
        const meal = document.getElementById("daily-meal").value;
        if (isNaN(amount) || amount <= 0) {
            alert("يرجى إدخال عدد صحيح للخبز!");
            return;
        }
        appData.current.daysRecord[currentRecordingDateStr] = { bought: true, amount: amount, meal: meal };
        document.getElementById("daily-amount").value = ""; 
    } else {
        appData.current.daysRecord[currentRecordingDateStr] = { bought: false, amount: 0, meal: "" };
    }

    saveData();
    updateDashboard();

    // فحص الإقفال التلقائي بعد التسجيل
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

// دالة الأرشفة وإنشاء تاريخ الجدول الجديد
function archiveCurrentSchedule() {
    alert("🍞 اكتمل عدد الخبز الكلي! سيتم حفظ الجدول الحالي في المشتريات السابقة وبدء جدول جديد.");
    
    // البحث عن آخر يوم تم الشراء فيه (وليس الأيام الفارغة)
    let lastBoughtStr = appData.current.startDate;
    for (const date in appData.current.daysRecord) {
        if (appData.current.daysRecord[date].bought && date > lastBoughtStr) {
            lastBoughtStr = date;
        }
    }

    // تجهيز تاريخ اليوم الذي يليه
    const d = new Date(lastBoughtStr);
    d.setDate(d.getDate() + 1);
    const nextStartStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');

    // نقل الجدول الحالي للأرشيف
    appData.history.push(appData.current);
    appData.current = null;
    saveData();

    // تجهيز الشاشة للجدول الجديد
    document.getElementById("setup-hint").innerText = `آخر يوم تم شراء الخبز فيه كان (${lastBoughtStr}). تم تحديد تاريخ البداية الجديد تلقائياً ليكون اليوم الذي يليه.`;
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
    const end = new Date(currentRecordingDateStr); // نعرض فقط إلى غاية اليوم الحالي المطلوب تسجيله
    
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
                           <button class="btn-close" onclick="editCurrentDay('${dStr}')" style="font-size:12px; margin-top:5px;">تعديل (حذف التسجيل)</button>`;
        } else {
            statusText = "اليوم الحالي المطلوب تسجيله";
            contentHtml = `<div class="day-status" style="margin-bottom:8px; color: var(--apple-text-muted);">${statusText}</div>`;
        }

        const card = document.createElement("div");
        card.className = `day-card ${statusClass}`;
        card.innerHTML = `<div class="day-info"><span class="day-date">${displayDate}</span>${contentHtml}</div>`;
        grid.appendChild(card);
        current.setDate(current.getDate() + 1);
    }
}

function editCurrentDay(dateStr) {
    if(confirm("سيتم مسح تسجيل هذا اليوم، وسيطلب منك النظام إدخاله من جديد. هل أنت متأكد؟")) {
        delete appData.current.daysRecord[dateStr];
        
        // مسح كل الأيام التي تليه حتى لا يختل التسلسل
        for (const date in appData.current.daysRecord) {
            if (date > dateStr) {
                delete appData.current.daysRecord[date];
            }
        }
        
        saveData();
        renderCurrentCalendar();
    }
}

// ----------------- قسم المشتريات السابقة (History) -----------------
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

        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <div class="history-header" onclick="toggleHistoryAccordion(this)">
                <h4>من ${schedule.startDate} إلى ${lastDate} <br><span style="font-size:12px; color:var(--apple-text-muted);">العدد الكلي: ${schedule.totalBread}</span></h4>
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

    if(html === "") html = "<p style='text-align:center;'>لا توجد بيانات مسجلة في هذا الجدول</p>";
    return html;
}

function resetApp() {
    if(confirm("هل أنت متأكد من حذف النظام بالكامل (الجدول الحالي والمشتريات السابقة)؟ لا يمكن التراجع عن هذا الإجراء.")) {
        localStorage.removeItem("breadAppStorage_v3");
        location.reload(); 
    }
}
