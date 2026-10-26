class DateTimePicker {
  constructor(inputId, options = {}) {
    this.input = document.getElementById(inputId);
    if (!this.input) {
      console.error(`Input element with id "${inputId}" not found`);
      return;
    }

    this.options = {
      minDate: options.minDate || null,
      maxDate: options.maxDate || null,
      defaultTime: options.defaultTime || '09:00',
      ...options
    };

    this.init();
  }

  init() {
    this.createPicker();
    this.bindEvents();
    this.setupMobileOptimization();
  }

  createPicker() {
    this.picker = document.createElement('div');
    this.picker.className = 'datetime-picker';
    this.picker.innerHTML = `
      <div class="picker-header">
        <button class="picker-btn picker-prev-month">&lt;</button>
        <span class="picker-title"></span>
        <button class="picker-btn picker-next-month">&gt;</button>
      </div>
      <div class="picker-body">
        <div class="picker-weekdays"></div>
        <div class="picker-days"></div>
      </div>
      <div class="picker-footer">
        <input type="time" class="picker-time" value="${this.options.defaultTime}">
        <button class="picker-btn picker-today">今天</button>
        <button class="picker-btn picker-confirm">确定</button>
      </div>
    `;

    document.body.appendChild(this.picker);
    this.pickerElements = {
      title: this.picker.querySelector('.picker-title'),
      weekdays: this.picker.querySelector('.picker-weekdays'),
      days: this.picker.querySelector('.picker-days'),
      timeInput: this.picker.querySelector('.picker-time'),
      prevMonth: this.picker.querySelector('.picker-prev-month'),
      nextMonth: this.picker.querySelector('.picker-next-month'),
      today: this.picker.querySelector('.picker-today'),
      confirm: this.picker.querySelector('.picker-confirm')
    };

    this.currentDate = new Date();
    this.selectedDate = null;
    this.renderWeekdays();
    this.renderDays();
  }

  renderWeekdays() {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    this.pickerElements.weekdays.innerHTML = weekdays.map(day => 
      `<div class="picker-weekday">${day}</div>`
    ).join('');
  }

  renderDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.pickerElements.title.textContent = `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    let html = '';
    
    for (let i = 0; i < startDay; i++) {
      html += '<div class="picker-day picker-empty"></div>';
    }
    
    const today = new Date();
    const minDate = this.options.minDate ? new Date(this.options.minDate) : null;
    const maxDate = this.options.maxDate ? new Date(this.options.maxDate) : null;
    
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = this.selectedDate && date.toDateString() === this.selectedDate.toDateString();
      const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);
      
      let classes = 'picker-day';
      if (isToday) classes += ' picker-today';
      if (isSelected) classes += ' picker-selected';
      if (isDisabled) classes += ' picker-disabled';
      
      html += `<div class="${classes}" data-day="${day}">${day}</div>`;
    }
    
    this.pickerElements.days.innerHTML = html;
  }

  bindEvents() {
    this.input.addEventListener('click', (e) => {
      e.stopPropagation();
      this.show();
    });
    this.input.addEventListener('focus', (e) => {
      e.stopPropagation();
      this.show();
    });
    
    this.picker.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    this.pickerElements.prevMonth.addEventListener('click', (e) => {
      e.stopPropagation();
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderDays();
    });
    
    this.pickerElements.nextMonth.addEventListener('click', (e) => {
      e.stopPropagation();
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderDays();
    });
    
    this.pickerElements.days.addEventListener('click', (e) => {
      e.stopPropagation();
      const dayEl = e.target.closest('.picker-day');
      if (dayEl && !dayEl.classList.contains('picker-empty') && !dayEl.classList.contains('picker-disabled')) {
        const day = parseInt(dayEl.dataset.day);
        this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        this.renderDays();
      }
    });
    
    this.pickerElements.today.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectedDate = new Date();
      this.currentDate = new Date();
      this.renderDays();
    });
    
    this.pickerElements.confirm.addEventListener('click', (e) => {
      e.stopPropagation();
      this.confirm();
    });
    
    document.addEventListener('click', (e) => {
      if (!this.picker.contains(e.target) && e.target !== this.input) {
        this.hide();
      }
    });
  }

  setupMobileOptimization() {
    if ('ontouchstart' in window) {
      this.picker.classList.add('mobile');
      
      const touchEvents = ['touchstart', 'touchmove', 'touchend'];
      touchEvents.forEach(event => {
        this.picker.addEventListener(event, (e) => {
          e.stopPropagation();
        }, { passive: true });
      });
    }
  }

  show() {
    const rect = this.input.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    this.picker.style.display = 'block';
    
    const pickerHeight = this.picker.offsetHeight;
    
    if (rect.bottom + pickerHeight > windowHeight) {
      this.picker.style.top = (rect.top - pickerHeight) + 'px';
    } else {
      this.picker.style.top = rect.bottom + 'px';
    }
    
    this.picker.style.left = rect.left + 'px';
    this.picker.style.width = Math.max(rect.width, 280) + 'px';
    
    if (this.input.value) {
      const date = new Date(this.input.value);
      if (!isNaN(date.getTime())) {
        this.selectedDate = date;
        this.currentDate = new Date(date);
        this.pickerElements.timeInput.value = this.formatTime(date);
        this.renderDays();
      }
    }
  }

  hide() {
    this.picker.style.display = 'none';
  }

  confirm() {
    if (!this.selectedDate) {
      this.selectedDate = new Date();
    }
    
    const time = this.pickerElements.timeInput.value;
    const [hours, minutes] = time.split(':').map(Number);
    
    this.selectedDate.setHours(hours, minutes, 0, 0);
    
    const formatted = this.formatDateTimeLocal(this.selectedDate);
    this.input.value = formatted;
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
    this.hide();
  }

  formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  getValue() {
    return this.input.value;
  }

  setValue(value) {
    this.input.value = value;
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        this.selectedDate = date;
        this.currentDate = new Date(date);
        this.pickerElements.timeInput.value = this.formatTime(date);
        this.renderDays();
      }
    }
  }
}
