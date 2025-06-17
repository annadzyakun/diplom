// Получаем значения из localStorage
const selectedArea = localStorage.getItem('selectedArea') || '60';
const frequency = localStorage.getItem('frequency') || 'razovaya';
// Получаем элементы, которые нужно обновлять
const cleaningTypeElement = document.getElementById('cleaning-type');
const apartmentInfoElement = document.getElementById('apartment-info');
const periodicityInfoElement = document.getElementById('periodicity-info');
const cleaningDateElement = document.getElementById('cleaning-date');
const cleaningTimeElement = document.getElementById('cleaning-time');
const cleaningCostElement = document.getElementById('cleaning-cost');
const totalCostElement = document.getElementById('total-cost');
const orderCommentDisplayElement = document.getElementById('order-comment-display');
const selectedAdditionalOptionElement = document.getElementById('selected-additional-option');

const squareButtons = document.querySelectorAll('.square-button');
const customSquareInput = document.getElementById('custom-square');
const cleaningTypeOptions = document.querySelectorAll('input[name="cleaning-type"]');
const timeOptions = document.querySelectorAll('input[name="time"]');
const periodicityButtons = document.querySelectorAll('.periodicity-button');
const dateInput = document.getElementById('date-input');
const orderCommentInput = document.getElementById('order-comment');
const additionalOptionsContainer = document.querySelector('.options-container');

let selectedAdditionalOptions = [];

//  *** Данные (замените на ваши реальные данные) ***
const baseCost = 0; // Базовая стоимость уборки (теперь 0)
const standardCleaningRate = 90; // рублей за кв. метр
const postRenovationCleaningRate = 100; // рублей за кв. метр
const deepCleaningRate = 235; // рублей за кв. метр

// Function to format the date (Date object to DD.MM.YYYY)
function formatDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Function to get the periodicity text
function getPeriodicityText(period) {
    switch (period) {
        case 'ezhenedelnaya': return 'Каждую неделю';
        case '2_raza_v_nedelyu': return 'Каждые две недели';
        default: return 'Один раз';
    }
}

function calculateCost(cleaningType, square) {
    let rate = 0;

    switch (cleaningType) {
        case 'Стандартная уборка':
            rate = standardCleaningRate;
            break;
        case 'Уборка после ремонта':
            rate = postRenovationCleaningRate;
            break;
        case 'Генеральная уборка':
            rate = deepCleaningRate;
            break;
        default:
            rate = standardCleaningRate; //  на всякий случай
    }

    return rate * square;
}

function updateOrderSummary() {
    // Получаем данные из элементов формы
    const selectedCleaningType = document.querySelector('input[name="cleaning-type"]:checked')?.value || 'Стандартная уборка';

    // Дополнительно:  выделение выбранного типа уборки
    cleaningTypeOptions.forEach(option => {
        const label = option.parentElement;
        if (option.checked) {
            label.classList.add('selected');
        } else {
            label.classList.remove('selected');
        }
    });

    let selectedSquare = 0;
    if (document.querySelector('.square-button.active')) {
        selectedSquare = parseInt(document.querySelector('.square-button.active').dataset.square);
    } else {
        selectedSquare = customSquareInput.value ? parseInt(customSquareInput.value) : 0;
    }

    const selectedApartment = selectedSquare > 0 ? selectedSquare + ' м²' : 'Не указана';

    const selectedDateText = dateInput.value ? formatDate(new Date(dateInput.value)) : 'Не выбрана';
    const selectedTime = document.querySelector('input[name="time"]:checked')?.value || 'Не выбрано';
    const selectedPeriodicity = document.querySelector('.periodicity-button.active')?.dataset.period || 'one-time';

    const orderComment = orderCommentInput.value || "Нет комментария";

    // Обновляем отображаемые данные
    cleaningTypeElement.textContent = selectedCleaningType;
    apartmentInfoElement.textContent = selectedApartment;
    cleaningDateElement.textContent = selectedDateText;
    cleaningTimeElement.textContent = selectedTime;
    periodicityInfoElement.textContent = getPeriodicityText(selectedPeriodicity);
    orderCommentDisplayElement.textContent = orderComment;

    // Расчет стоимости
    let cost = calculateCost(selectedCleaningType, selectedSquare);

    const selectedOptionsText = selectedAdditionalOptions.length > 0 ?
        selectedAdditionalOptions.map(option => {
            const optionItem = document.querySelector(`.option-item[data-option="${option}"]`);
            if (optionItem) {
                const priceElement = optionItem.querySelector('.option-price');
                const priceText = priceElement.textContent;
                const nameElement = optionItem.querySelector('p'); //  Получаем элемент с именем
                const nameText = nameElement.textContent; //  Получаем имя
                return `${nameText} (${priceText})`; // используем имя вместо option
            }
            return `${option.replace(/_/g, ' ')} (Элемент не найден)`;
        }).join(', ') :
        "Нет дополнительных опций";

    selectedAdditionalOptionElement.textContent = selectedOptionsText;

    // Обновление общей стоимости с учетом дополнительных опций
    selectedAdditionalOptions.forEach(selectedOption => {
        const optionItem = document.querySelector(`.option-item[data-option="${selectedOption}"]`);
        if (optionItem) {
            const priceText = optionItem.querySelector('.option-price').textContent;
            const price = parseFloat(priceText.replace(/[^\d\.]/g, ''));
            cost += price;
        }
    });

    // Установка отображения стоимости
    cleaningCostElement.textContent = cost.toLocaleString('ru-RU') + ' ₽';
    totalCostElement.textContent = cost.toLocaleString('ru-RU') + ' ₽';
}

additionalOptionsContainer.addEventListener('click', (event) => {
    const optionItem = event.target.closest('.option-item');

    if (optionItem) {
        const optionValue = optionItem.dataset.option;

        if (selectedAdditionalOptions.includes(optionValue)) {
            selectedAdditionalOptions = selectedAdditionalOptions.filter(option => option !== optionValue);
            optionItem.classList.remove('selected');
        } else {
            selectedAdditionalOptions.push(optionValue);
            optionItem.classList.add('selected');
        }

        updateOrderSummary();
    }
});

// Добавляем обработчики событий
squareButtons.forEach(button => {
    button.addEventListener('click', () => {
        squareButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        updateOrderSummary();
    });
});

customSquareInput.addEventListener('input', () => {
    squareButtons.forEach(btn => btn.classList.remove('active'));
    updateOrderSummary();
});

cleaningTypeOptions.forEach(option => {
    option.addEventListener('change', updateOrderSummary);
});

timeOptions.forEach(option => {
    option.addEventListener('change', updateOrderSummary);
});

periodicityButtons.forEach(button => {
    button.addEventListener('click', () => {
        periodicityButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        updateOrderSummary();
    });
});

dateInput.addEventListener('change', updateOrderSummary);
orderCommentInput.addEventListener('input', updateOrderSummary);

// Инициализация
updateOrderSummary();