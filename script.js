// Исходные данные из localStorage
const pcBuildData = JSON.parse(localStorage.getItem('pcBuildData')) || {};
let selectedStore = localStorage.getItem('selectedStore');
let totalPrice = 0;

// Функция для сохранения данных в localStorage
function saveData() {
    localStorage.setItem('pcBuildData', JSON.stringify(pcBuildData));
    localStorage.setItem('selectedStore', selectedStore);
}

// 1. Конфигуратор ПК

// Получаем элементы DOM
const cpuSelect = document.getElementById('cpu-select');
const motherboardSelect = document.getElementById('motherboard-select');
const ramSelect = document.getElementById('ram-select');
const gpuSelect = document.getElementById('gpu-select');
const storageSelect = document.getElementById('storage-select');
const powerSupplySelect = document.getElementById('power-supply-select');
const buildPcButton = document.getElementById('build-pc-button');
const pcComponentsList = document.getElementById('pc-components-list');
const totalPriceSpan = document.getElementById('total-price');
const compatibilityMessage = document.getElementById('compatibility-message');

// Данные о компонентах ПК (пример)
const componentsData = {
    cpu: [
        { id: 'cpu1', name: 'Intel Core i5-12600K', price: 25000, socket: 'LGA1700' },
        { id: 'cpu2', name: 'AMD Ryzen 5 5600X', price: 20000, socket: 'AM4' },
    ],
    motherboard: [
        { id: 'mb1', name: 'MSI MAG B660M Mortar', price: 12000, socket: 'LGA1700', chipset: 'B660' },
        { id: 'mb2', name: 'ASUS ROG Strix B550-F Gaming', price: 14000, socket: 'AM4', chipset: 'B550' },
    ],
    ram: [
        { id: 'ram1', name: 'Corsair Vengeance LPX 16GB (2x8GB) DDR4 3200MHz', price: 6000, type: 'DDR4' },
        { id: 'ram2', name: 'G.Skill Ripjaws V 16GB (2x8GB) DDR4 3600MHz', price: 7000, type: 'DDR4' },
    ],
    gpu: [
        { id: 'gpu1', name: 'NVIDIA GeForce RTX 3060', price: 40000 },
        { id: 'gpu2', name: 'AMD Radeon RX 6600 XT', price: 35000 },
    ],
    storage: [
        { id: 'storage1', name: 'Samsung 980 Pro 1TB NVMe SSD', price: 10000 },
        { id: 'storage2', name: 'Crucial MX500 1TB SATA SSD', price: 8000 },
    ],
    powerSupply: [
        { id: 'psu1', name: 'Corsair RM750x (2021)', price: 12000, wattage: 750 },
        { id: 'psu2', name: 'Seasonic FOCUS GX-750', price: 11000, wattage: 750 },
    ],
};

// Helper function to create option element
function createOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
}

// Заполнение выпадающего списка компонентами
function populateComponentSelect(selectElement, componentType) {
    selectElement.innerHTML = '<option value="" disabled selected>Выберите ' + getComponentLabel(componentType) + '</option>';
    componentsData[componentType].forEach(component => {
        selectElement.appendChild(createOption(component.id, component.name));
    });
    if (pcBuildData[componentType]) {
        selectElement.value = pcBuildData[componentType];
    }
}

// Функция для получения названия компонента
function getComponentLabel(componentType) {
    switch (componentType) {
        case 'cpu': return 'процессор';
        case 'motherboard': return 'материнскую плату';
        case 'ram': return 'оперативную память';
        case 'gpu': return 'видеокарту';
        case 'storage': return 'накопитель';
        case 'powerSupply': return 'блок питания';
        default: return componentType;
    }
}

// Функция проверки совместимости компонентов
function checkCompatibility() {
    const cpuId = pcBuildData.cpu;
    const motherboardId = pcBuildData.motherboard;

    if (!cpuId || !motherboardId) return '';

    const cpu = componentsData.cpu.find(c => c.id === cpuId);
    const motherboard = componentsData.motherboard.find(mb => mb.id === motherboardId);

    if (cpu.socket !== motherboard.socket) {
        return "Несовместимость: процессор и материнская плата несовместимы (разные сокеты).";
    }
    return '';
}

// Обновление выбранных компонентов и подсчет цены
function updatePcSummary() {
    pcComponentsList.innerHTML = '';
    totalPrice = 0;

    let compatibility = checkCompatibility();
    compatibilityMessage.textContent = compatibility;

    for (const componentType in pcBuildData) {
        const componentId = pcBuildData[componentType];
        if (componentId) {
            const component = componentsData[componentType].find(c => c.id === componentId);
            if (component) {
                const listItem = document.createElement('li');
                listItem.textContent = `${getComponentLabel(componentType)}: ${component.name} - ${component.price} ₽`;
                pcComponentsList.appendChild(listItem);
                totalPrice += component.price;
            }
        }
    }
    totalPriceSpan.textContent = totalPrice;

    saveData();
}

// 2. Интерактивная карта продаж
const mapContainer = document.getElementById('map');
const storeSelect = document.getElementById('store-select');
const deliveryInfo = document.getElementById('delivery-info');
const deliveryCostSpan = document.getElementById('delivery-cost');

let map; // Объект карты Яндекс.Карт
let placemarks = []; // Массив для хранения меток (placemarks) магазинов

// Данные о магазинах и доставке (пример)
const storesData = [
    { id: 'store1', name: 'InfinityStore Москва', latitude: 55.7512, longitude: 37.6184, deliveryCost: 300 },
    { id: 'store2', name: 'InfinityStore Санкт-Петербург', latitude: 59.9391, longitude: 30.3167, deliveryCost: 400 },
    { id: 'store3', name: 'InfinityStore Магнитогорск', latitude: 53.423349, longitude: 58.978989, deliveryCost: 450 },
];

// Функция инициализации карты
function initMap() {
    if (!mapContainer) return;

    ymaps.ready(function () {
        map = new ymaps.Map('map', {
            center: [55.75, 37.61],
            zoom: 5,
            controls: ['zoomControl', 'searchControl'],
        });

        map.setType('yandex#map');
        addStoreMarkers();
    });
}

// Функция для добавления меток магазинов
function addStoreMarkers() {
    if (!map) return;

    storesData.forEach(store => {
        const placemark = new ymaps.Placemark(
            [store.latitude, store.longitude],
            {
                hintContent: store.name,
                balloonContent: `
                    <div>
                        <b>${store.name}</b><br>
                        Стоимость доставки: ${store.deliveryCost} ₽
                    </div>`
            },
            {
                iconLayout: 'default#image',
                iconImageHref: 'images/store_icon.png',
                iconImageSize: [32, 32],
                iconImageOffset: [-16, -16]
            }
        );

        map.geoObjects.add(placemark);
        placemarks.push(placemark);
        placemark.storeId = store.id;

        placemark.events.add('click', function () {
            storeSelect.value = store.id;
            updateDeliveryInfo();
        });
    });
}

// Заполнение выпадающего списка магазинами
function populateStoreSelect() {
    if (!storeSelect) return;

    storeSelect.innerHTML = '<option value="" disabled selected>Выберите магазин</option>';
    storesData.forEach(store => {
        storeSelect.appendChild(createOption(store.id, store.name));
    });

    if (selectedStore) {
        storeSelect.value = selectedStore;
        updateDeliveryInfo();
    }
}

// Функция для обновления информации о доставке
function updateDeliveryInfo() {
    const selectedStoreId = storeSelect.value;
    selectedStore = selectedStoreId;

    const selectedStoreData = storesData.find(store => store.id === selectedStoreId);

    if (selectedStoreData) {
        deliveryCostSpan.textContent = selectedStoreData.deliveryCost;
        saveData();

        if (map && selectedStoreData) {
            map.setCenter([selectedStoreData.latitude, selectedStoreData.longitude], 13);
        }
    } else {
        deliveryCostSpan.textContent = '0';
    }
}

// 3. Подготовка и запуск

// Event listeners для конфигуратора ПК
cpuSelect.addEventListener('change', (event) => { pcBuildData.cpu = event.target.value; });
motherboardSelect.addEventListener('change', (event) => { pcBuildData.motherboard = event.target.value; });
ramSelect.addEventListener('change', (event) => { pcBuildData.ram = event.target.value; });
gpuSelect.addEventListener('change', (event) => { pcBuildData.gpu = event.target.value; });
storageSelect.addEventListener('change', (event) => { pcBuildData.storage = event.target.value; });
powerSupplySelect.addEventListener('change', (event) => { pcBuildData.powerSupply = event.target.value; });
buildPcButton.addEventListener('click', updatePcSummary);

// Event listeners для карты
if (storeSelect) {
    storeSelect.addEventListener('change', updateDeliveryInfo);
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Конфигуратор ПК
    populateComponentSelect(cpuSelect, 'cpu');
    populateComponentSelect(motherboardSelect, 'motherboard');
    populateComponentSelect(ramSelect, 'ram');
    populateComponentSelect(gpuSelect, 'gpu');
    populateComponentSelect(storageSelect, 'storage');
    populateComponentSelect(powerSupplySelect, 'powerSupply');
    updatePcSummary();

    // Карта
    initMap();
    populateStoreSelect();
});