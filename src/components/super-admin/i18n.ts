import type { ColorField, RestaurantDesignSettings, SuperAdminLanguage } from "./types";

export const designLabelDictionary: Record<
  SuperAdminLanguage,
  {
    basicSettings: string;
    previewCompare: string;
    savedPreview: string;
    draftPreview: string;
    changedFields: string;
    noChanges: string;
    sectionHeader: string;
    sectionCategoryDish: string;
    sectionBasketControls: string;
    headerCaption: string;
    categoryName: string;
    dishName: string;
    dishDescription: string;
    addButton: string;
    qtySection: string;
    totalLabel: string;
    successSample: string;
    errorSample: string;
    fieldBrandName: string;
    fieldBrandSubtitle: string;
    paletteBuilder: string;
    paletteHint: string;
    basePrimary: string;
    baseSecondary: string;
    baseNeutral: string;
    autoGeneratePalette: string;
    paletteGenerated: string;
    fieldCurrency: string;
    fieldTableCount: string;
    fieldButtonRadius: string;
    fieldCardRadius: string;
    fieldPrimaryColor: string;
    fieldAccentTextColor: string;
    fieldBackgroundFrom: string;
    fieldBackgroundTo: string;
    fieldSurfaceColor: string;
    fieldTextColor: string;
    fieldMutedTextColor: string;
    fieldBorderColor: string;
    fieldPanelColor: string;
    fieldOverlayColor: string;
    fieldControlSurfaceColor: string;
    fieldActiveChipBackground: string;
    fieldActiveChipTextColor: string;
    fieldInactiveChipBackground: string;
    fieldInactiveChipTextColor: string;
    fieldDividerColor: string;
    fieldSuccessColor: string;
    fieldErrorColor: string;
    fieldCategoryTitleColor: string;
    fieldQtyButtonBackground: string;
    fieldQtyButtonTextColor: string;
    fieldQtyButtonBorderColor: string;
    resetToSaved: string;
    resetToDefault: string;
  }
> = {
  en: {
    basicSettings: "Simple Settings",
    previewCompare: "Before and After Preview",
    savedPreview: "Saved now",
    draftPreview: "Will be after save",
    changedFields: "Changes before save",
    noChanges: "No changes yet",
    sectionHeader: "Header",
    sectionCategoryDish: "Category + Dish Card",
    sectionBasketControls: "Basket + Controls",
    headerCaption: "Bar & Lounge QR Menu",
    categoryName: "Soups",
    dishName: "Creamy mushroom soup",
    dishDescription: "Light cream, champignons, herbs.",
    addButton: "Add",
    qtySection: "Quantity buttons",
    totalLabel: "Total",
    successSample: "Success sample",
    errorSample: "Error sample",
    fieldBrandName: "Brand Name",
    fieldBrandSubtitle: "Brand Subtitle",
    paletteBuilder: "Auto Palette From 3 Colors",
    paletteHint: "Pick 3 core colors, then auto-fill the whole restaurant palette.",
    basePrimary: "Base Primary",
    baseSecondary: "Base Secondary",
    baseNeutral: "Base Neutral",
    autoGeneratePalette: "Generate matching palette",
    paletteGenerated: "Palette generated from 3 base colors.",
    fieldCurrency: "Currency",
    fieldTableCount: "Table Count",
    fieldButtonRadius: "Button Radius (px)",
    fieldCardRadius: "Card Radius (px)",
    fieldPrimaryColor: "Primary",
    fieldAccentTextColor: "Primary Text",
    fieldBackgroundFrom: "Background From",
    fieldBackgroundTo: "Background To",
    fieldSurfaceColor: "Surface",
    fieldTextColor: "Text",
    fieldMutedTextColor: "Muted Text",
    fieldBorderColor: "Border",
    fieldPanelColor: "Panel/Basket",
    fieldOverlayColor: "Modal Overlay",
    fieldControlSurfaceColor: "Input Surface",
    fieldActiveChipBackground: "Lang Active BG",
    fieldActiveChipTextColor: "Lang Active Text",
    fieldInactiveChipBackground: "Lang Inactive BG",
    fieldInactiveChipTextColor: "Lang Inactive Text",
    fieldDividerColor: "Divider",
    fieldSuccessColor: "Success",
    fieldErrorColor: "Error",
    fieldCategoryTitleColor: "Category Title",
    fieldQtyButtonBackground: "Plus/Minus BG",
    fieldQtyButtonTextColor: "Plus/Minus Text",
    fieldQtyButtonBorderColor: "Plus/Minus Border",
    resetToSaved: "Reset to saved",
    resetToDefault: "Reset to default",
  },
  ru: {
    basicSettings: "Простые настройки",
    previewCompare: "Превью до и после",
    savedPreview: "Сейчас сохранено",
    draftPreview: "Будет после сохранения",
    changedFields: "Изменения перед сохранением",
    noChanges: "Изменений пока нет",
    sectionHeader: "Хедер",
    sectionCategoryDish: "Категория + карточка блюда",
    sectionBasketControls: "Корзина + контролы",
    headerCaption: "QR меню ресторана",
    categoryName: "Супы",
    dishName: "Грибной крем-суп",
    dishDescription: "Сливки, шампиньоны, зелень.",
    addButton: "Добавить",
    qtySection: "Кнопки количества",
    totalLabel: "Итого",
    successSample: "Пример успеха",
    errorSample: "Пример ошибки",
    fieldBrandName: "Название бренда",
    fieldBrandSubtitle: "Подзаголовок",
    paletteBuilder: "Авто-палитра из 3 цветов",
    paletteHint: "Выберите 3 базовых цвета, остальные применятся автоматически.",
    basePrimary: "Базовый основной",
    baseSecondary: "Базовый дополнительный",
    baseNeutral: "Базовый нейтральный",
    autoGeneratePalette: "Сгенерировать палитру",
    paletteGenerated: "Палитра сгенерирована из 3 базовых цветов.",
    fieldCurrency: "Валюта",
    fieldTableCount: "Количество столов",
    fieldButtonRadius: "Радиус кнопок (px)",
    fieldCardRadius: "Радиус карточек (px)",
    fieldPrimaryColor: "Основной",
    fieldAccentTextColor: "Текст на основном",
    fieldBackgroundFrom: "Фон от",
    fieldBackgroundTo: "Фон до",
    fieldSurfaceColor: "Поверхность",
    fieldTextColor: "Текст",
    fieldMutedTextColor: "Вторичный текст",
    fieldBorderColor: "Граница",
    fieldPanelColor: "Панель/корзина",
    fieldOverlayColor: "Оверлей модалки",
    fieldControlSurfaceColor: "Поверхность инпутов",
    fieldActiveChipBackground: "Язык активный фон",
    fieldActiveChipTextColor: "Язык активный текст",
    fieldInactiveChipBackground: "Язык неактивный фон",
    fieldInactiveChipTextColor: "Язык неактивный текст",
    fieldDividerColor: "Разделитель",
    fieldSuccessColor: "Успех",
    fieldErrorColor: "Ошибка",
    fieldCategoryTitleColor: "Заголовок категории",
    fieldQtyButtonBackground: "Плюс/минус фон",
    fieldQtyButtonTextColor: "Плюс/минус текст",
    fieldQtyButtonBorderColor: "Плюс/минус граница",
    resetToSaved: "Вернуть сохраненное",
    resetToDefault: "Сбросить по умолчанию",
  },
  az: {
    basicSettings: "Sade parametrlər",
    previewCompare: "Əvvəl və sonra önbaxış",
    savedPreview: "Hazırda saxlanılan",
    draftPreview: "Saxlandıqdan sonra",
    changedFields: "Saxlamadan öncə dəyişikliklər",
    noChanges: "Hələ dəyişiklik yoxdur",
    sectionHeader: "Header",
    sectionCategoryDish: "Kateqoriya + yemək kartı",
    sectionBasketControls: "Səbət + idarəetmə",
    headerCaption: "Restoran QR menyusu",
    categoryName: "Şorbalar",
    dishName: "Göbələk krem şorbası",
    dishDescription: "Qaymaq, göbələk, göyərti.",
    addButton: "Əlavə et",
    qtySection: "Miqdar düymələri",
    totalLabel: "Cəmi",
    successSample: "Uğurlu nümunə",
    errorSample: "Xəta nümunəsi",
    fieldBrandName: "Brend adı",
    fieldBrandSubtitle: "Alt başlıq",
    paletteBuilder: "3 rəngdən avtomatik palitra",
    paletteHint: "3 əsas rəng seçin, qalan rənglər avtomatik doldurulacaq.",
    basePrimary: "Əsas baza rəngi",
    baseSecondary: "İkinci baza rəngi",
    baseNeutral: "Neytral baza rəngi",
    autoGeneratePalette: "Palitranı avtomatik yarat",
    paletteGenerated: "Palitra 3 baza rəngindən yaradıldı.",
    fieldCurrency: "Valyuta",
    fieldTableCount: "Masa sayı",
    fieldButtonRadius: "Düymə radiusu (px)",
    fieldCardRadius: "Kart radiusu (px)",
    fieldPrimaryColor: "Əsas rəng",
    fieldAccentTextColor: "Əsas üzərində mətn",
    fieldBackgroundFrom: "Fon başlanğıcı",
    fieldBackgroundTo: "Fon sonu",
    fieldSurfaceColor: "Səth",
    fieldTextColor: "Mətn",
    fieldMutedTextColor: "Zəif mətn",
    fieldBorderColor: "Sərhəd",
    fieldPanelColor: "Panel/səbət",
    fieldOverlayColor: "Modal overlay",
    fieldControlSurfaceColor: "Input səthi",
    fieldActiveChipBackground: "Dil aktiv fon",
    fieldActiveChipTextColor: "Dil aktiv mətn",
    fieldInactiveChipBackground: "Dil passiv fon",
    fieldInactiveChipTextColor: "Dil passiv mətn",
    fieldDividerColor: "Ayırıcı",
    fieldSuccessColor: "Uğurlu",
    fieldErrorColor: "Xəta",
    fieldCategoryTitleColor: "Kateqoriya başlığı",
    fieldQtyButtonBackground: "Plus/minus fon",
    fieldQtyButtonTextColor: "Plus/minus mətn",
    fieldQtyButtonBorderColor: "Plus/minus sərhəd",
    resetToSaved: "Saxlanılana qaytar",
    resetToDefault: "Defolta sıfırla",
  },
};

export function getFieldLabel(field: ColorField, labels: (typeof designLabelDictionary)[SuperAdminLanguage]) {
  const map: Record<ColorField, string> = {
    primaryColor: labels.fieldPrimaryColor,
    accentTextColor: labels.fieldAccentTextColor,
    backgroundFrom: labels.fieldBackgroundFrom,
    backgroundTo: labels.fieldBackgroundTo,
    surfaceColor: labels.fieldSurfaceColor,
    textColor: labels.fieldTextColor,
    mutedTextColor: labels.fieldMutedTextColor,
    borderColor: labels.fieldBorderColor,
    panelColor: labels.fieldPanelColor,
    overlayColor: labels.fieldOverlayColor,
    controlSurfaceColor: labels.fieldControlSurfaceColor,
    activeChipBackground: labels.fieldActiveChipBackground,
    activeChipTextColor: labels.fieldActiveChipTextColor,
    inactiveChipBackground: labels.fieldInactiveChipBackground,
    inactiveChipTextColor: labels.fieldInactiveChipTextColor,
    dividerColor: labels.fieldDividerColor,
    successColor: labels.fieldSuccessColor,
    errorColor: labels.fieldErrorColor,
    categoryTitleColor: labels.fieldCategoryTitleColor,
    qtyButtonBackground: labels.fieldQtyButtonBackground,
    qtyButtonTextColor: labels.fieldQtyButtonTextColor,
    qtyButtonBorderColor: labels.fieldQtyButtonBorderColor,
  };

  return map[field];
}

export function getChangedFieldLabel(
  field: keyof RestaurantDesignSettings,
  labels: (typeof designLabelDictionary)[SuperAdminLanguage],
) {
  if (field === "brandName") return labels.fieldBrandName;
  if (field === "brandSubtitle") return labels.fieldBrandSubtitle;
  if (field === "tableCount") return labels.fieldTableCount;
  if (field === "buttonRadius") return labels.fieldButtonRadius;
  if (field === "cardRadius") return labels.fieldCardRadius;
  if (field === "currencyMode") return labels.fieldCurrency;

  return getFieldLabel(field as ColorField, labels);
}


export const dictionary: Record<
  SuperAdminLanguage,
  {
    superAdmin: string;
    login: string;
    password: string;
    logout: string;
    restaurants: string;
    menu: string;
    qr: string;
    refresh: string;
    selectRestaurant: string;
    restaurantName: string;
    restaurantSlug: string;
    addRestaurant: string;
    editRestaurant: string;
    deleteRestaurant: string;
    createRestaurant: string;
    serviceMode: string;
    serviceModeLite: string;
    serviceModePro: string;
    allDishes: string;
    searchDishByName: string;
    noDishResults: string;
    addDish: string;
    editDish: string;
    nameEn: string;
    nameRu: string;
    nameAz: string;
    descriptionEn: string;
    descriptionRu: string;
    descriptionAz: string;
    price: string;
    selectCategory: string;
    imageUrl: string;
    framingPreview: string;
    positionX: string;
    positionY: string;
    create: string;
    update: string;
    reset: string;
    addCategory: string;
    categoryEn: string;
    categoryRu: string;
    categoryAz: string;
    addCategoryButton: string;
    qrTitle: string;
    tableCount: string;
    tableCountHint: string;
    tableLabel: string;
    edit: string;
    delete: string;
    uploadingImage: string;
    uploadFailed: string;
    saveDishFailed: string;
    addCategoryFailed: string;
    saving: string;
    design: string;
    designTitle: string;
    saveDesign: string;
    rgbEditor: string;
    designSaved: string;
    selectRestaurantFirst: string;
    downloadQr: string;
    downloadStyledQr: string;
  }
> = {
  en: {
    superAdmin: "Super Admin",
    login: "Login",
    password: "Password",
    logout: "Logout",
    restaurants: "Restaurants",
    menu: "Menu Management",
    selectRestaurant: "Select Restaurant",
    restaurantName: "Restaurant Name",
    restaurantSlug: "URL Slug",
    addRestaurant: "Add Restaurant",
    editRestaurant: "Edit Restaurant",
    deleteRestaurant: "Delete Restaurant",
    createRestaurant: "Create Restaurant",
    serviceMode: "Mode",
    serviceModeLite: "Lite (menu + basket only)",
    serviceModePro: "Pro (menu + waiter + online orders)",
    qr: "QR Codes",
    refresh: "Refresh",
    allDishes: "All Dishes",
    searchDishByName: "Search dish by name",
    noDishResults: "No dishes found for this query.",
    addDish: "Add Dish",
    editDish: "Edit Dish",
    nameEn: "Name EN",
    nameRu: "Name RU",
    nameAz: "Name AZ",
    descriptionEn: "Description EN",
    descriptionRu: "Description RU",
    descriptionAz: "Description AZ",
    price: "Price",
    selectCategory: "Select category",
    imageUrl: "Image URL",
    framingPreview: "Menu framing preview",
    positionX: "Position X",
    positionY: "Position Y",
    create: "Create",
    update: "Update",
    reset: "Reset",
    addCategory: "Add Category",
    categoryEn: "Category EN",
    categoryRu: "Category RU",
    categoryAz: "Category AZ",
    addCategoryButton: "Add category",
    qrTitle: "QR Menu Links",
    tableCount: "Tables Count",
    tableCountHint: "Set how many tables this restaurant has. QR codes are generated automatically.",
    tableLabel: "Table",
    edit: "Edit",
    delete: "Delete",
    uploadingImage: "Uploading image...",
    uploadFailed: "Upload failed.",
    saveDishFailed: "Failed to save dish.",
    addCategoryFailed: "Failed to add category.",
    saving: "Saving...",
    design: "Design",
    designTitle: "Restaurant Design Studio",
    saveDesign: "Save Design",
    rgbEditor: "RGB color editor",
    designSaved: "Design saved successfully.",
    selectRestaurantFirst: "Select a restaurant first.",
    downloadQr: "Download QR",
    downloadStyledQr: "Download Styled Card",
  },
  ru: {
    superAdmin: "Супер Админ",
    login: "Логин",
    password: "Пароль",
    logout: "Выйти",
    restaurants: "Рестораны",
    menu: "Управление меню",
    selectRestaurant: "Выберите ресторан",
    restaurantName: "Название ресторана",
    restaurantSlug: "URL идентификатор",
    addRestaurant: "Добавить ресторан",
    editRestaurant: "Редактировать ресторан",
    deleteRestaurant: "Удалить ресторан",
    createRestaurant: "Создать ресторан",
    serviceMode: "Режим",
    serviceModeLite: "Лайт (меню + корзина)",
    serviceModePro: "Про (меню + вызов официанта + онлайн заказ)",
    qr: "QR коды",
    refresh: "Обновить",
    allDishes: "Все блюда",
    searchDishByName: "Поиск блюда по названию",
    noDishResults: "По вашему запросу ничего не найдено.",
    addDish: "Добавить блюдо",
    editDish: "Редактировать блюдо",
    nameEn: "Название EN",
    nameRu: "Название RU",
    nameAz: "Название AZ",
    descriptionEn: "Описание EN",
    descriptionRu: "Описание RU",
    descriptionAz: "Описание AZ",
    price: "Цена",
    selectCategory: "Выберите категорию",
    imageUrl: "Ссылка на изображение",
    framingPreview: "Предпросмотр кадрирования меню",
    positionX: "Позиция X",
    positionY: "Позиция Y",
    create: "Создать",
    update: "Обновить",
    reset: "Сбросить",
    addCategory: "Добавить категорию",
    categoryEn: "Категория EN",
    categoryRu: "Категория RU",
    categoryAz: "Категория AZ",
    addCategoryButton: "Добавить категорию",
    qrTitle: "QR меню ссылки",
    tableCount: "Количество столов",
    tableCountHint: "Укажите количество столов. QR-коды будут сгенерированы автоматически.",
    tableLabel: "Стол",
    edit: "Изменить",
    delete: "Удалить",
    uploadingImage: "Загрузка изображения...",
    uploadFailed: "Ошибка загрузки.",
    saveDishFailed: "Не удалось сохранить блюдо.",
    addCategoryFailed: "Не удалось добавить категорию.",
    saving: "Сохранение...",
    design: "Дизайн",
    designTitle: "Студия дизайна ресторана",
    saveDesign: "Сохранить дизайн",
    rgbEditor: "RGB редактор цветов",
    designSaved: "Дизайн успешно сохранен.",
    selectRestaurantFirst: "Сначала выберите ресторан.",
    downloadQr: "Скачать QR",
    downloadStyledQr: "Скачать карточку",
  },
  az: {
    superAdmin: "Super Admin",
    login: "Login",
    password: "Sifre",
    logout: "Cixis",
    restaurants: "Restoranlar",
    menu: "Menyu idaresi",
    selectRestaurant: "Restoran secin",
    restaurantName: "Restoran adi",
    restaurantSlug: "URL identifikator",
    addRestaurant: "Restoran elave et",
    editRestaurant: "Restorani redakte et",
    deleteRestaurant: "Restorani sil",
    createRestaurant: "Restoran yarat",
    serviceMode: "Rejim",
    serviceModeLite: "Lite (menyu + səbət)",
    serviceModePro: "Pro (menyu + ofisiant çağırışı + onlayn sifariş)",
    qr: "QR kodlar",
    refresh: "Yenile",
    allDishes: "Butun yemekler",
    searchDishByName: "Yemek adina gore axtar",
    noDishResults: "Bu sorquya uygun yemek tapilmadi.",
    addDish: "Yemek elave et",
    editDish: "Yemeyi redakte et",
    nameEn: "Ad EN",
    nameRu: "Ad RU",
    nameAz: "Ad AZ",
    descriptionEn: "Tesvir EN",
    descriptionRu: "Tesvir RU",
    descriptionAz: "Tesvir AZ",
    price: "Qiymet",
    selectCategory: "Kateqoriya secin",
    imageUrl: "Sekil linki",
    framingPreview: "Menyu kadr preview",
    positionX: "Pozisiya X",
    positionY: "Pozisiya Y",
    create: "Yarat",
    update: "Yenile",
    reset: "Sifirla",
    addCategory: "Kateqoriya elave et",
    categoryEn: "Kateqoriya EN",
    categoryRu: "Kateqoriya RU",
    categoryAz: "Kateqoriya AZ",
    addCategoryButton: "Kateqoriya elave et",
    qrTitle: "QR menyu linkleri",
    tableCount: "Masa sayi",
    tableCountHint: "Bu restoran ucun masa sayini daxil edin. QR kodlar avtomatik yaranacaq.",
    tableLabel: "Masa",
    edit: "Redakte et",
    delete: "Sil",
    uploadingImage: "Sekil yuklenir...",
    uploadFailed: "Yukleme ugursuz oldu.",
    saveDishFailed: "Yemek saxlanmadi.",
    addCategoryFailed: "Kateqoriya elave olunmadi.",
    saving: "Saxlanilir...",
    design: "Dizayn",
    designTitle: "Restoran dizayn studiyasi",
    saveDesign: "Dizayni saxla",
    rgbEditor: "RGB reng redaktoru",
    designSaved: "Dizayn ugurla saxlanildi.",
    selectRestaurantFirst: "Evvelce restoran secin.",
    downloadQr: "QR yukle",
    downloadStyledQr: "Dizayn karti yukle",
  },
};
