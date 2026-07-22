// المتغيرات الأساسية وبيانات التطبيق
let appData = {
    startDate: null,
    endDate: null,
    totalBread: 0,
    moneyPaid: false,
    flourDelivered: false,
    daysRecord: {} 
};

let currentRecordingDateStr = null; // لتخزين اليوم الذي يطالبك النظام بتسجيله الآن

// عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    setupTodayHeader();
    checkAppStatus();
});

// إعداد ترويسة اليوم بتنسيق أبل (هذا يعرض اليوم الحقيقي دائماً في الأعلى)
function setupTodayHeader() {
    const today = new Date();
    const optionsDay = { weekday: 'long' };
    const optionsDate = { day: 'numeric', month: 'numeric', year: 'numeric' };
    
    document.getElementById("today-day-name").innerText = today.toLocaleDateString('ar-IQ', optionsDay);
    document.getElementById("today-full-date").innerText = today.toLocaleDateString('ar-IQ', optionsDate);
}

// تحميل البيانات من المتصفح (LocalStorage)
function loadData() {
    const saved = localStorage.getItem("breadAppData");
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// حفظ البيانات
function saveData() {
    localStorage.setItem("breadAppData", JSON.stringify(appData));
}

// فحص حالة التطبيق
function checkAppStatus() {
    if (!appData.startDate) {
        document.getElementById("setup-section").classList.remove("hidden");
        document.getElementById("main-dashboard").classList.add("hidden");
    } else {
        document.getElementById("setup-section").classList.add("hidden");
        document.getElementById("main-dashboard").classList.remove("hidden");
        updateDashboard();
    }
}

// إنشاء جدول جديد
function createNewSchedule() {
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    const total = parseInt(document.getElementById("total-bread-input").value);

    if (!start || !end || isNaN(total) || total <= 0) {
        alert("يرجى إدخال جميع البيانات بشكل صحيح!");
        return;
    }

    if (new Date(start) > new Date(end)) {
        alert("تاريخ البداية يجب أن يكون قبل تاريخ النهاية.");
        return;
    }

    appData = {
        startDate: start,
        endDate: end,
        totalBread: total,
        moneyPaid: false,
        flourDelivered: false,
        daysRecord: {}
    };

    saveData();
    checkAppStatus();
}

// تحديث لوحة التحكم
function updateDashboard() {
    // 1. حساب المتبقي
    let consumed = 0;
    for (const date in appData.daysRecord) {
        if (appData.daysRecord[date].bought) {
            consumed += appData.daysRecord[date].amount;
        }
    }
    const remaining = appData.totalBread - consumed;
    
    document.getElementById("total-bread").innerText = appData.totalBread;
    const remainingEl = document.getElementById("remaining-bread");
    remainingEl.innerText = remaining;

    // تلوين المتبقي بشكل ذكي (أحمر إذا قل عن 20%)
    if (remaining < (appData.totalBread * 0.2)) {
        remainingEl.style.color = "var(--apple-red)";
    } else if (remaining < (appData.totalBread * 0.5)) {
        remainingEl.style.color = "var(--apple-orange)";
    } else {
        remainingEl.style.color = "var(--apple-green)";
    }

    // 2. تحديث مفاتيح الاشتراكات
    document.getElementById("money-toggle").checked = appData.moneyPaid;
    document.getElementById("flour-toggle").checked = appData.flourDelivered;
    updateSubscriptionText();

    // 3. تحديث واجهة التسجيل (جلب اليوم التالي المطلوب تسجيله)
    updateRecordingUI();
}

// تحديث نصوص وألوان الاشتراكات
function updateSubscription() {
    appData.moneyPaid = document.getElementById("money-toggle").checked;
    appData.flourDelivered = document.getElementById("flour-toggle").checked;
    saveData();
    updateSubscriptionText();
}

function updateSubscriptionText() {
    const moneyLabel = document.getElementById("money-label");
    const flourLabel = document.getElementById("flour-label");

    if (appData.moneyPaid) {
        moneyLabel.innerText = "فلوس الاشتراك (واصل)";
        moneyLabel.style.color = "var(--apple-green)";
    } else {
        moneyLabel.innerText = "فلوس الاشتراك (غير واصل)";
        moneyLabel.style.color = "var(--apple-red)";
    }

    if (appData.flourDelivered) {
        flourLabel.innerText = "الطحين (واصل)";
        flourLabel.style.color = "var(--apple-green)";
    } else {
        flourLabel.innerText = "الطحين (غير واصل)";
        flourLabel.style.color = "var(--apple-red)";
    }
}

// البحث عن أول يوم غير مسجل وعرضه
function updateRecordingUI() {
    let current = new Date(appData.startDate);
    const end = new Date(appData.endDate);
    currentRecordingDateStr = null;

    // البحث بالتسلسل من يوم البداية حتى يوم النهاية
    while (current <= end) {
        const dStr = current.getFullYear() + "-" + String(current.getMonth() + 1).padStart(2, '0') + "-" + String(current.getDate()).padStart(2, '0');
        if (!appData.daysRecord[dStr]) {
            currentRecordingDateStr = dStr;
            break;
        }
        current.setDate(current.getDate() + 1);
    }

    const titleEl = document.getElementById("record-card-title");
    const warning = document.getElementById("missing-days-warning");
    
    if (currentRecordingDateStr) {
        // إذا وجدنا يوم غير مسجل، نظهر اسمه وتاريخه
        const parts = currentRecordingDateStr.split("-");
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const dayName = d.toLocaleDateString('ar-IQ', { weekday: 'long' });
        const month = d.getMonth() + 1;
        const day = d.getDate();
        
        titleEl.innerText = `تسجيل خبز اليوم (${dayName} ${month}/${day})`;
        document.getElementById("daily-amount").disabled = false;
        document.getElementById("daily-meal").disabled = false;

        // التحقق مما إذا كان هذا اليوم المطلوب تسجيله أقدم من اليوم الحقيقي
        const today = new Date();
        const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');
        
        if (currentRecordingDateStr < todayStr) {
            warning.classList.remove("hidden");
            warning.innerText = `⚠️ تنبيه: أنت تقوم الآن بتسجيل يوم فائت!`;
        } else {
            warning.classList.add("hidden");
        }

    } else {
        // إذا اكتملت كل الأيام
        titleEl.innerText = "🎉 تم تسجيل جميع أيام الجدول بالكامل!";
        document.getElementById("daily-amount").disabled = true;
        document.getElementById("daily-meal").disabled = true;
        warning.classList.add("hidden");
    }
}

// تسجيل الخبز لليوم المتسلسل الذي تم تحديده
function recordToday(didBuy) {
    if (!currentRecordingDateStr) {
        alert("لقد قمت بتسجيل جميع أيام الجدول بالفعل!");
        return;
    }

    if (didBuy) {
        const amount = parseInt(document.getElementById("daily-amount").value);
        const meal = document.getElementById("daily-meal").value;
        
        if (isNaN(amount) || amount <= 0) {
            alert("يرجى إدخال عدد صحيح للخبز!");
            return;
        }

        appData.daysRecord[currentRecordingDateStr] = { bought: true, amount: amount, meal: meal };
        document.getElementById("daily-amount").value = ""; 
    } else {
        // لم يشتري
        appData.daysRecord[currentRecordingDateStr] = { bought: false, amount: 0, meal: "" };
    }

    saveData();
    // التحديث سيقوم تلقائياً بالبحث عن اليوم الذي يليه وإظهاره!
    updateDashboard();
}

// إظهار وإخفاء الجدول (الروزنامة)
function toggleTable() {
    const tableSection = document.getElementById("table-section");
    if (tableSection.classList.contains("hidden")) {
        renderCalendar();
        tableSection.classList.remove("hidden");
    } else {
        tableSection.classList.add("hidden");
        updateDashboard(); 
    }
}

// توليد الجدول وعرضه
function renderCalendar() {
    const grid = document.getElementById("calendar-grid");
    grid.innerHTML = "";

    const start = new Date(appData.startDate);
    const end = new Date(appData.endDate);
    let current = new Date(start);

    while (current <= end) {
        const dStr = current.getFullYear() + "-" + String(current.getMonth() + 1).padStart(2, '0') + "-" + String(current.getDate()).padStart(2, '0');
        const displayDate = current.toLocaleDateString('ar-IQ', { weekday: 'short', day: 'numeric', month: 'numeric' });
        
        const record = appData.daysRecord[dStr];
        let statusClass = "";
        let statusText = "";
        let contentHtml = "";

        if (record) {
            if (record.bought) {
                statusClass = "status-bought";
                statusText = `شراء: ${record.amount} (${record.meal})`;
                contentHtml = `<div class="day-status">${statusText}</div>
                               <button class="btn-close" onclick="editDay('${dStr}')" style="font-size:12px; margin-top:5px;">تعديل (حذف التسجيل)</button>`;
            } else {
                statusClass = "status-empty";
                statusText = "فارغ (لم أشتري)";
                contentHtml = `<div class="day-status">${statusText}</div>
                               <button class="btn-close" onclick="editDay('${dStr}')" style="font-size:12px; margin-top:5px;">تعديل (حذف التسجيل)</button>`;
            }
        } else {
            statusText = "غير مسجل بعد";
            contentHtml = `<div class="day-status" style="margin-bottom:8px; color: var(--apple-text-muted);">${statusText}</div>`;
        }

        const card = document.createElement("div");
        card.className = `day-card ${statusClass}`;
        card.innerHTML = `
            <div class="day-info">
                <span class="day-date">${displayDate}</span>
                ${contentHtml}
            </div>
        `;
        grid.appendChild(card);

        current.setDate(current.getDate() + 1);
    }
}

// مسح تسجيل يوم (عند الضغط على تعديل في الروزنامة، سيُمسح ليعود للواجهة الرئيسية وتتمكن من تسجيله من جديد)
function editDay(dateStr) {
    if(confirm("سيتم مسح تسجيل هذا اليوم، لتتمكن من إدخاله من جديد. هل أنت متأكد؟")) {
        delete appData.daysRecord[dateStr];
        saveData();
        renderCalendar();
    }
}

// إعادة تصفير التطبيق بالكامل
function resetApp() {
    if(confirm("هل أنت متأكد من حذف الجدول الحالي والبدء من جديد؟ ستُمسح جميع السجلات.")) {
        localStorage.removeItem("breadAppData");
        location.reload(); 
    }
}
