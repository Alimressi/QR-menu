import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Uzbechka's printed menu, transcribed from "Menyu Uzbechka.pdf" (2 pages,
// 13 sections, 120 items) and loaded verbatim.
//
// The rows this replaces were an earlier, unrelated draft: 57 dishes in nine
// sections, of which only 23 names survived into the printed menu and two of
// those at the wrong price. Rather than reconcile two menus, the restaurant's
// categories are dropped and rebuilt, which cascades to its dishes.
//
// Wording, spelling and prices are the printed menu's own — including its
// quirks. They are the restaurant's to correct, not this script's.
//
// The menu carries no English, and the rows it replaces used the Azerbaijani
// text for nameEn too, so that convention continues. Russian names and
// ingredient lists come from the printed menu's own Russian half.
//
// Usage: node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-uzbechka-menu.ts [slug]

type MenuDish = {
  nameAz: string;
  nameRu: string;
  price: number;
  descriptionAz?: string;
  descriptionRu?: string;
};

type MenuCategory = {
  nameAz: string;
  nameRu: string;
  nameEn: string;
  dishes: MenuDish[];
};

const MENU: MenuCategory[] = [
  {
    nameAz: "Salatlar",
    nameRu: "Салаты",
    nameEn: "Salads",
    dishes: [
      {
        nameAz: "Açuçuk salatı",
        nameRu: "Салат Ачучук",
        price: 4,
        descriptionAz: "Pomidor, soğan, acı bibər, duz",
        descriptionRu: "Помидор, лук, острый перец, соль",
      },
      {
        nameAz: "Uzbechka salatı",
        nameRu: "Салат Узбечка",
        price: 5,
        descriptionAz: "Kələm, xiyar, qırmızı bibər, göyərti, kök, uksus",
        descriptionRu: "Капуста, огурец, красный сладкий перец, зелень, морковь, уксус",
      },
      {
        nameAz: "Xarəzm salatı",
        nameRu: "Салат Хорезм",
        price: 15,
        descriptionAz: "Dana əti, xiyar, rəngli bibər, kök, soğan, pomidor, göyərti, sarımsaq, küncüt, uksus, soya sous, duz, qara istiot, nanə",
        descriptionRu: "Говядина, огурец, сладкий перец разноцветный, морковь, лук, помидор, зелень, чеснок, кунжут, уксус, соевый соус, соль, чёрный перец, мята",
      },
      {
        nameAz: "Kök salatı",
        nameRu: "Морковный салат",
        price: 4,
        descriptionAz: "Kök qırmızı, qırmızı istiot, duz, qara istiot, sarımsaq, koreya duzu",
        descriptionRu: "Морковь красная, красный молотый перец, соль, чёрный перец, чеснок, корейская соль",
      },
      {
        nameAz: "Çoban salatı",
        nameRu: "Салат Ачучук",
        price: 6,
        descriptionAz: "Pomidor, xiyar, göyərti, limon",
        descriptionRu: "Помидор, огурец, зелень, лимон",
      },
      {
        nameAz: "Çoban salatı pendir ilə",
        nameRu: "Чобан салат с сыром",
        price: 7,
        descriptionAz: "Pomidor, xiyar, göyərti, limon, ağ pendir",
        descriptionRu: "Помидор, огурец, зелень, лимон, белый сыр",
      },
      {
        nameAz: "Tərəvəz buketi",
        nameRu: "Овощной букет",
        price: 5,
        descriptionAz: "Pomidor, xiyar, göyərti, acı bibər",
        descriptionRu: "Помидоры, огурцы, зелень, горький перец",
      },
      {
        nameAz: "Pendir Assorti",
        nameRu: "Сырное ассорти",
        price: 13,
        descriptionAz: "Ağ pendir, holland pendiri, motal pendiri, saçaq pendir, hisə verilmiş pendir, şor",
        descriptionRu: "Белый сыр, голландский сыр, сыр мотал, сыр косичка, копчёный сыр, солёный творог",
      },
      {
        nameAz: "Vişnə döyməsi",
        nameRu: "Вишнёвый салат",
        price: 5,
        descriptionAz: "Vişnə, turşu, göyərti, sarımsaq, limon",
        descriptionRu: "Вишня, соленья, зелень, чеснок, лимон",
      },
      {
        nameAz: "Xırt-Xırt badımcan",
        nameRu: "Хрустящий баклажан",
        price: 8,
        descriptionAz: "Badımcan, aysberq kələmi, kahı, çeri pomidor, xiyar, soğan qırmızı, küncüt, duz, bibər sousu, teryaki sous",
        descriptionRu: "Баклажан, капуста айсберг, листья салата, помидоры черри, огурец, красный лук, кунжут, соль, перечный соус, соус терияки",
      },
      {
        nameAz: "Manqal salatı",
        nameRu: "Салат Мангал",
        price: 6,
        descriptionAz: "Badımcan, pomidor, rəngli bibər, qırmızı soğan, göyərti, duz, istiot, zeytun yağı",
        descriptionRu: "Баклажан, помидор, сладкий перец разноцветный, красный лук, зелень, соль, перец, оливковое масло",
      },
      {
        nameAz: "Gavalı salatı",
        nameRu: "Салат с черносливом",
        price: 7,
        descriptionAz: "Toyuq filesi, qoz ləpəsi, qara gavalı, sarımsaq, duz, qara istiot, mayonez",
        descriptionRu: "Куриное филе, грецкий орех, чернослив, чеснок, соль, чёрный перец, майонез",
      },
      {
        nameAz: "Paytaxt salatı",
        nameRu: "Салат «Пайтахт»",
        price: 7,
        descriptionAz: "Toyuq filesi, kartof, kök qırmızı, xiyar turşusu, xiyar, qarox, mayonez",
        descriptionRu: "Куриное филе, картофель, морковь, солёный огурец, огурец, зелёный горох, майонез",
      },
      {
        nameAz: "Alma salça",
        nameRu: "Яблочное пюре",
        price: 5,
        descriptionAz: "Yaşıl alma, qarışıq turşu, göyərti",
        descriptionRu: "Зелёное яблоко, соленья, зелень",
      },
      {
        nameAz: "Haydari",
        nameRu: "Хайдари",
        price: 5,
        descriptionAz: "Qatıq, süzmə, sarımsaq, ədviyyatlar",
        descriptionRu: "Простокваша, сцеженная простокваша, чеснок, специи",
      },
      {
        nameAz: "Albalılı pomidor",
        nameRu: "Помидоры с вишней",
        price: 8,
        descriptionAz: "Pomidor, albalı, qırmızı soğan, zoğal əzməsi, acı bibər, göyərti",
        descriptionRu: "Помидор, вишня, красный лук, кизиловое пюре, острый перец, зелень",
      },
      {
        nameAz: "Göbələk salatı",
        nameRu: "Грибной салат",
        price: 6,
        descriptionAz: "Toyuq filesi, göbələk, kartof, yumurta, göyərti, duz, mayonez, xama",
        descriptionRu: "Куриное филе, грибы, картофель, яйца, зелень, соль, майонез, сметана",
      },
      {
        nameAz: "Sezar salatı",
        nameRu: "Салат Цезарь",
        price: 13,
        descriptionAz: "Toyuq filesi, aysberq kələmi, çeri pomidor, bildirçin yumurtası, sarımsaq, parmezan pendiri, suxari, sezar sousu",
        descriptionRu: "Куриное филе, капуста айсберг, помидоры черри, перепелиные яйца, чеснок, сыр пармезан, сухари, соус цезарь",
      },
      {
        nameAz: "Tərəvəz salatı",
        nameRu: "Овощной салат",
        price: 12,
        descriptionAz: "Toyuq filesi, yaşıl bibər, rəngli bibər, limon, xiyar, xiyar turşusu, şirin qarğıdalı, mayonez",
        descriptionRu: "Куриное филе, зелёный перец, сладкий разноцветный перец, лимон, огурец, солёный огурец, сладкая кукуруза, майонез",
      },
      {
        nameAz: "Badımcan Rulet",
        nameRu: "Рулетики из баклажанов",
        price: 7,
        descriptionAz: "Badımcan, qoz ləpəsi, sarımsaq, göyərti, küncüt, pendir",
        descriptionRu: "Баклажан, грецкий орех, чеснок, зелень, кунжут, белый сыр",
      },
      {
        nameAz: "Süzmə",
        nameRu: "Сюзьма",
        price: 5,
        descriptionAz: "Süzmə, qaymaq, küncüt",
        descriptionRu: "Сцеженная простокваша, сливки, кунжут",
      },
      {
        nameAz: "Acika",
        nameRu: "Аджика",
        price: 4,
        descriptionAz: "Tomat, göyərti, sarımsaq, uksus, duz, ədviyyatlar",
        descriptionRu: "Томатная паста, зелень, чеснок, уксус, соль, специи",
      },
    ],
  },
  {
    nameAz: "Şorbalar",
    nameRu: "Супы",
    nameEn: "Soups",
    dishes: [
      {
        nameAz: "Çuçvara Şorbası",
        nameRu: "Суп Чучвара",
        price: 10,
        descriptionAz: "Dana əti, soğan, xəmir, duz, istiot",
        descriptionRu: "Говядина, лук, тесто, соль, перец",
      },
      {
        nameAz: "Şurpa",
        nameRu: "Шурпа",
        price: 11,
        descriptionAz: "Dana əti, kartof, soğan, kök, göyərti, duz",
        descriptionRu: "Говядина, картофель, лук, морковь, зелень, соль",
      },
      {
        nameAz: "Mastava",
        nameRu: "Мастава",
        price: 11,
        descriptionAz: "Dana əti, kartof, soğan, düyü, yaşıl bibər, rəngli bibər, pomidor, sarımsaq, tomat, göyərti, duz, istiot",
        descriptionRu: "Говядина, картофель, лук, круглый рис, болгарский перец, сладкий разноцветный перец, помидор, чеснок, томатная паста, зелень, соль, перец",
      },
      {
        nameAz: "Lağman",
        nameRu: "Лагман",
        price: 14,
        descriptionAz: "Dana əti, yaşıl bibər, rəngli bibər, pomidor, acı bibər, sarımsaq, kərəviz, kələm, soğan, göyərti, kök, evsayağı əriştə, duz, istiot, xüsusi sous",
        descriptionRu: "Говядина, болгарский перец, сладкий разноцветный перец, помидор, острый перец, чеснок, сельдерей, капуста, лук, зелень, морковь, домашняя лапша, соль, перец, специальный соус",
      },
      {
        nameAz: "Közə Şurpa",
        nameRu: "Шурпа в горшочке",
        price: 15,
        descriptionAz: "Quzu əti, kartof, soğan, kök, rəngli bibər, duz, istiot",
        descriptionRu: "Баранина, картофель, лук, морковь, сладкий разноцветный перец, соль, перец",
      },
      {
        nameAz: "Toyuq şorbası",
        nameRu: "Куриный суп",
        price: 6,
        descriptionAz: "Toyuq əti, kartof, duz, istiot",
        descriptionRu: "Курица, картофель, соль, перец",
      },
      {
        nameAz: "Mərcimək",
        nameRu: "Чечевичный суп",
        price: 5,
        descriptionAz: "Mərci, bulqur, sarımsaq, tomat, kərə yağı, duz, istiot",
        descriptionRu: "Чечевица, булгур, чеснок, томатная паста, сливочное масло, соль, перец",
      },
      {
        nameAz: "Tomat şorbası",
        nameRu: "Томатный суп",
        price: 6,
        descriptionAz: "Tomat sousu, holland pendiri, kərə yağı, süd, duz, qırmızı istiot",
        descriptionRu: "Томатная паста, голландский сыр, сливочное масло, молоко, соль, красный молотый перец",
      },
      {
        nameAz: "Okroşka",
        nameRu: "Окрошка",
        price: 5,
        descriptionAz: "Qatıq, xiyar, göyərti, duz",
        descriptionRu: "Простокваша, огурец, зелень, соль",
      },
      {
        nameAz: "Xarəzm okroşkası",
        nameRu: "Хорезмская окрошка",
        price: 8,
        descriptionAz: "Qatıq, dana əti, kartof, yumurta, göyərti, duz",
        descriptionRu: "Простокваша, говядина, картофель, яйца, зелень, соль",
      },
    ],
  },
  {
    nameAz: "Uşaq Menyusu",
    nameRu: "Детское меню",
    nameEn: "Kids menu",
    dishes: [
      {
        nameAz: "Kartof Fri",
        nameRu: "Картофель фри",
        price: 5,
      },
      {
        nameAz: "Naggets",
        nameRu: "Наггетсы",
        price: 7,
      },
      {
        nameAz: "Düyü",
        nameRu: "Рис",
        price: 5,
      },
      {
        nameAz: "Pendir çubuqları",
        nameRu: "Сырные палочки",
        price: 10,
      },
    ],
  },
  {
    nameAz: "Samsa",
    nameRu: "Самса",
    nameEn: "Samsa",
    dishes: [
      {
        nameAz: "Təndir samsa ət ilə",
        nameRu: "Тандырная самса с мясом",
        price: 3.5,
        descriptionAz: "Dana əti, dana piyi, soğan, qat-qat xəmir, duz, qara istiot",
        descriptionRu: "Говядина, говяжий жир, лук, слоёное тесто, соль, чёрный перец",
      },
      {
        nameAz: "Təndir samsa toyuq ilə",
        nameRu: "Тандырная самса с курицей",
        price: 2.5,
        descriptionAz: "Toyuq filesi, soğan, qat-qat xəmir, duz, qara istiot",
        descriptionRu: "Куриное филе, лук, слоёное тесто, соль, чёрный перец",
      },
      {
        nameAz: "Alat Samsa ət ilə",
        nameRu: "Алатская самса с мясом",
        price: 3.5,
        descriptionAz: "Dana əti, dana piyi, soğan, pomidor, acı bibər, xəmir, duz, qara istiot",
        descriptionRu: "Говядина, говяжий жир, лук, помидор, острый перец, тесто, соль, чёрный перец",
      },
      {
        nameAz: "Alat Samsa toyuq ilə",
        nameRu: "Алатская самса с курицей",
        price: 2.5,
        descriptionAz: "Toyuq filesi, soğan, pomidor, acı bibər, xəmir, duz, qara istiot",
        descriptionRu: "Куриное филе, лук, помидор, острый перец, тесто, соль, чёрный перец",
      },
      {
        nameAz: "Duxovka Samsa ət ilə",
        nameRu: "Самса из духовки с мясом",
        price: 3.5,
        descriptionAz: "Dana əti, dana piyi, soğan, qat-qat xəmir, duz, qara istiot",
        descriptionRu: "Говядина, говяжий жир, лук, слоёное тесто, соль, чёрный перец",
      },
      {
        nameAz: "Xarəzm Gömməsi (Çeburek)",
        nameRu: "Хорезмская гёмме (Чебурек)",
        price: 3,
        descriptionAz: "Dana əti, soğan, xəmir, duz, qara istiot",
        descriptionRu: "Говядина, лук, тесто, соль, чёрный перец",
      },
    ],
  },
  {
    nameAz: "İsti Yeməklər",
    nameRu: "Горячие блюда",
    nameEn: "Hot dishes",
    dishes: [
      {
        nameAz: "Mantı",
        nameRu: "Манты",
        price: 13,
        descriptionAz: "Dana əti, soğan, xəmir, duz, qara istiot",
        descriptionRu: "Говядина, лук, тесто, соль, чёрный перец",
      },
      {
        nameAz: "Color Mantı (qırmızı, yaşıl, sarı)",
        nameRu: "Цветные манты (красные, зелёные, жёлтые)",
        price: 13,
        descriptionAz: "Dana əti, soğan, xəmir, duz, qara istiot",
        descriptionRu: "Говядина, лук, тесто, соль, чёрный перец",
      },
      {
        nameAz: "Çuçvara Qızardılmış",
        nameRu: "Жареная чучвара",
        price: 11,
        descriptionAz: "Dana əti, soğan, xəmir, duz, istiot, kartof fri",
        descriptionRu: "Говядина, лук, тесто, соль, перец, картофель фри",
      },
      {
        nameAz: "Xonum",
        nameRu: "Ханум",
        price: 11,
        descriptionAz: "Dana əti, soğan, kartof, duz, qara istiot",
        descriptionRu: "Говядина, лук, картофель, соль, чёрный перец",
      },
      {
        nameAz: "Gülxonum",
        nameRu: "Гюльханум",
        price: 11,
        descriptionAz: "Dana əti, kartof, soğan, duz, istiot",
        descriptionRu: "Говядина, картофель, лук, соль, чёрный перец",
      },
      {
        nameAz: "Kazan kabab",
        nameRu: "Казан-кебаб",
        price: 17,
        descriptionAz: "Dana əti, quzu əti, kartof, qırmızı soğan, xiyar, pomidor, kahı, yaşıl bibər, duz, istiot",
        descriptionRu: "Говядина, баранина, картофель, красный лук, огурец, помидор, листья салата, болгарский перец, соль, перец",
      },
      {
        nameAz: "Qızardılmış Lagman",
        nameRu: "Жареный лагман",
        price: 15,
        descriptionAz: "Dana əti, kərəviz, rəngli bibər, kələm, yaşıl bibər, soğan, göyərti, pomidor, evsayağı əriştə, sarımsaq, acı bibər, tomat, sous, duz, istiot",
        descriptionRu: "Говядина, сельдерей, сладкий разноцветный перец, капуста, болгарский перец, лук, зелень, помидор, домашняя лапша, чеснок, острый перец, томатная паста, соус, соль, перец",
      },
      {
        nameAz: "Tabaka",
        nameRu: "Цыплёнок табака",
        price: 20,
        descriptionAz: "Özəl hazırlanmış sousda marinad olunmuş toyuq",
        descriptionRu: "Курица, маринованная в специальном соусе",
      },
      {
        nameAz: "Xarəzm lüləsi",
        nameRu: "Хорезмская люля",
        price: 12,
        descriptionAz: "Dana əti, soğan, tomat, qaymaq, süd, duz, qara istiot, kartof pürə",
        descriptionRu: "Говядина, лук, томатная паста, сливки, молоко, соль, чёрный перец, картофельное пюре",
      },
      {
        nameAz: "Xiva Lagmanı",
        nameRu: "Хивинский лагман",
        price: 10,
        descriptionAz: "Göyərtili xəmir, dana əti, kartof, soğan, rəngli bibər, yaşıl bibər, kök, duz, qara istiot",
        descriptionRu: "Тесто с зеленью, говядина, картофель, лук, сладкий разноцветный перец, болгарский перец, морковь, соль, чёрный перец",
      },
      {
        nameAz: "Ətli Say",
        nameRu: "Сай с мясом",
        price: 16,
        descriptionAz: "Dana əti, rəngli bibər, sarımsaq, xiyar, soğan, düyü, duz, qırmızı istiot, soya sous",
        descriptionRu: "Говядина, сладкий разноцветный перец, чеснок, огурец, лук, рис, красный молотый перец, соевый соус",
      },
      {
        nameAz: "Toyuqlu Say",
        nameRu: "Сай с курицей",
        price: 14,
        descriptionAz: "Toyuq əti, rəngli bibər, sarımsaq, xiyar, soğan, düyü, duz, qırmızı istiot, soya sous",
        descriptionRu: "Куриное мясо, сладкий разноцветный перец, чеснок, огурец, лук, рис, красный молотый перец, соевый соус",
      },
      {
        nameAz: "Bərək assorti",
        nameRu: "Ассорти борак",
        price: 18,
        descriptionAz: "Dana əti, balqabaq, yumurta, göyərti, kartof, xəmir, duz, istiot, qatıq",
        descriptionRu: "Говядина, тыква, яйцо, зелень, картофель, тесто, соль, перец, простокваша",
      },
      {
        nameAz: "Ət ilə bərək",
        nameRu: "Борак с мясом",
        price: 8,
        descriptionAz: "Dana əti, xəmir, duz, istiot, qatıq",
        descriptionRu: "Говядина, тесто, соль, перец, простокваша",
      },
      {
        nameAz: "Göyərti bərək",
        nameRu: "Борак с зеленью",
        price: 7,
        descriptionAz: "Göyərti, kartof, xəmir, duz, istiot, qatıq",
        descriptionRu: "Зелень, картофель, тесто, соль, перец, простокваша",
      },
      {
        nameAz: "Yumurta bərək",
        nameRu: "Борак с яйцом",
        price: 7,
        descriptionAz: "Yumurta, göyərti, kartof, xəmir, duz, istiot, qatıq",
        descriptionRu: "Яйцо, зелень, картофель, тесто, соль, перец, простокваша",
      },
      {
        nameAz: "Balqabaq bərək",
        nameRu: "Борак с тыквой",
        price: 7,
        descriptionAz: "Balqabaq, xəmir, duz, istiot, qatıq",
        descriptionRu: "Тыква, тесто, соль, перец, простокваша",
      },
      {
        nameAz: "Kartof bərək",
        nameRu: "Борак с картофелем",
        price: 7,
        descriptionAz: "Kartof, xəmir, duz, istiot, qatıq",
        descriptionRu: "Картофель, тесто, соль, перец, простокваша",
      },
    ],
  },
  {
    nameAz: "Özbək Kababları",
    nameRu: "Узбекские кебабы",
    nameEn: "Uzbek kebabs",
    dishes: [
      {
        nameAz: "Dana lülə kababı",
        nameRu: "Люля-кебаб из говядины",
        price: 8,
      },
      {
        nameAz: "Dana rulet",
        nameRu: "Говяжий рулет",
        price: 11,
      },
      {
        nameAz: "Napaleon kababı",
        nameRu: "Кебаб «Наполеон»",
        price: 11,
      },
      {
        nameAz: "Dana basdırması quyruq ilə",
        nameRu: "Говяжья бастурма с курдюком",
        price: 10,
      },
      {
        nameAz: "Özbək kabab seti 4 nəfərlik",
        nameRu: "Узбекский набор кебабов на 4 персоны",
        price: 80,
      },
      {
        nameAz: "Quzu basdırması quyruq ilə",
        nameRu: "Баранья бастурма с курдюком",
        price: 11,
      },
      {
        nameAz: "Kartof quyruq ilə",
        nameRu: "Картофель с курдюком",
        price: 6,
      },
      {
        nameAz: "Toyuq lülə",
        nameRu: "Куриная люля",
        price: 7,
      },
      {
        nameAz: "Özbək kabab seti 6 nəfərlik",
        nameRu: "Узбекский набор кебабов на 6 персон",
        price: 120,
      },
    ],
  },
  {
    nameAz: "Milli Kababları",
    nameRu: "Национальные кебабы",
    nameEn: "National kebabs",
    dishes: [
      {
        nameAz: "Antrikot",
        nameRu: "Антрекот",
        price: 11,
      },
      {
        nameAz: "Yablocka",
        nameRu: "Яблочко",
        price: 11,
      },
      {
        nameAz: "Tikə kabab",
        nameRu: "Шашлык",
        price: 10,
      },
      {
        nameAz: "Dana ciyər",
        nameRu: "Говяжья печень",
        price: 6,
      },
      {
        nameAz: "Dana ciyər quyruq ilə",
        nameRu: "Говяжья печень с курдюком",
        price: 7,
      },
      {
        nameAz: "Quzu ciyər quyruq ilə",
        nameRu: "Баранья печень с курдюком",
        price: 7,
      },
      {
        nameAz: "Xan kababı",
        nameRu: "Хан-кебаб",
        price: 7,
      },
      {
        nameAz: "Milli kabab seti 4 nəfərlik",
        nameRu: "Национальный набор кебабов на 4 персоны",
        price: 80,
      },
      {
        nameAz: "Lülə quzu",
        nameRu: "Люля из баранины",
        price: 8,
      },
      {
        nameAz: "Toyuq kababı",
        nameRu: "Куриный шашлык",
        price: 8,
      },
      {
        nameAz: "Toyuq File kababı",
        nameRu: "Шашлык из куриного филе",
        price: 8,
      },
      {
        nameAz: "Kartof lüləsi",
        nameRu: "Картофельная люля",
        price: 5,
      },
      {
        nameAz: "Tərərvəz kabab",
        nameRu: "Овощной кебаб",
        price: 6,
      },
      {
        nameAz: "Badımcan quyruq ilə",
        nameRu: "Баклажан с курдюком",
        price: 6,
      },
      {
        nameAz: "Milli kabab seti 6 nəfərlik",
        nameRu: "Национальный набор кебабов на 6 персон",
        price: 120,
      },
    ],
  },
  {
    nameAz: "Sərin içkilər",
    nameRu: "Прохладительные напитки",
    nameEn: "Cold drinks",
    dishes: [
      {
        nameAz: "Coca Cola classic 0,33 banka",
        nameRu: "Coca-Cola Classic 0,33 банка",
        price: 3,
      },
      {
        nameAz: "Coca Cola zero 0,33 banka",
        nameRu: "Coca-Cola Zero 0,33 банка",
        price: 3,
      },
      {
        nameAz: "Fanta 0,33 banka",
        nameRu: "Fanta 0,33 банка",
        price: 3,
      },
      {
        nameAz: "Sprite 0,33 banka",
        nameRu: "Sprite 0,33 банка",
        price: 3,
      },
      {
        nameAz: "Kompot 1lt assorti",
        nameRu: "Компот 1 л ассорти",
        price: 6,
      },
      {
        nameAz: "Ayran 200ml",
        nameRu: "Айран 200 мл",
        price: 2,
      },
      {
        nameAz: "Blanc Blue qazlı su 0,33",
        nameRu: "Blanc Blue газированная вода 0,33",
        price: 3,
      },
      {
        nameAz: "Blanc Blue qazsız su 0,33",
        nameRu: "Blanc Blue негазированная вода 0,33",
        price: 3,
      },
      {
        nameAz: "Blanc Blue qazlı su 0,70",
        nameRu: "Blanc Blue газированная вода 0,70",
        price: 5,
      },
      {
        nameAz: "Blanc Blue qazsız su 0,70",
        nameRu: "Blanc Blue негазированная вода 0,70",
        price: 5,
      },
      {
        nameAz: "Sirab şüşə qazlı 0,33",
        nameRu: "Sirab газированная вода стекло 0,33",
        price: 3.5,
      },
      {
        nameAz: "Sirab şüşə qazsız 0,33",
        nameRu: "Sirab негазированная вода стекло 0,33",
        price: 3.5,
      },
    ],
  },
  {
    nameAz: "Ətirli çaylar",
    nameRu: "Ароматные чаи",
    nameEn: "Flavoured teas",
    dishes: [
      {
        nameAz: "Çay Jasmin yaşıl",
        nameRu: "Зелёный чай Жасмин",
        price: 8,
      },
      {
        nameAz: "Çay Jasmin qara",
        nameRu: "Чёрный чай Жасмин",
        price: 8,
      },
      {
        nameAz: "Çay Barbaris",
        nameRu: "Чай барбарис",
        price: 8,
      },
      {
        nameAz: "Çay şaftalı",
        nameRu: "Персиковый чай",
        price: 8,
      },
      {
        nameAz: "Çay sakura",
        nameRu: "Чай сакура",
        price: 8,
      },
      {
        nameAz: "Çay 1001 gecə",
        nameRu: "Чай «1001 ночь»",
        price: 8,
      },
      {
        nameAz: "Çay sitrus",
        nameRu: "Цитрусовый чай",
        price: 8,
      },
      {
        nameAz: "Sadə qara çay",
        nameRu: "Классический чёрный чай",
        price: 5,
      },
      {
        nameAz: "Sadə yaşıl çay",
        nameRu: "Классический зелёный чай",
        price: 5,
      },
    ],
  },
  {
    nameAz: "Desertlər",
    nameRu: "Десерты",
    nameEn: "Desserts",
    dishes: [
      {
        nameAz: "Çak Çak ballı 150 qr",
        nameRu: "Чак-чак с мёдом 150 гр",
        price: 4,
      },
      {
        nameAz: "Çak Çak ballı 250 qr",
        nameRu: "Чак-чак с мёдом 250 гр",
        price: 6,
      },
      {
        nameAz: "Özbək halva çeşidləri",
        nameRu: "Узбекская халва ассорти",
        price: 8,
      },
      {
        nameAz: "Assorti çərəz və quru meyvələr",
        nameRu: "Ассорти орехов и сухофруктов",
        price: 8,
      },
    ],
  },
  {
    nameAz: "Özbək Plovları",
    nameRu: "Узбекские пловы",
    nameEn: "Uzbek pilafs",
    dishes: [
      {
        nameAz: "Daşkənd toy aşı",
        nameRu: "Ташкентский праздничный плов",
        price: 12,
        descriptionAz: "Dana əti, düyü, quyruq, kök sarı, kök qırmızı, noxud, kişmiş, bildirçin yumurtası, sarımsaq, soğan, zirə, duz",
        descriptionRu: "Говядина, рис, курдюк, жёлтая морковь, красная морковь, нут, кишмиш, перепелиное яйцо, чеснок, лук, зира, соль",
      },
      {
        nameAz: "Samarkand zığır aşı",
        nameRu: "Самаркандский плов с льняным маслом",
        price: 13,
        descriptionAz: "Dana əti, düyü, quyruq, kök sarı, kök qırmızı, noxud, kişmiş, bildirçin yumurtası, sarımsaq, soğan, zirə, duz, zığır yağı",
        descriptionRu: "Говядина, рис, курдюк, жёлтая морковь, красная морковь, нут, кишмиш, перепелиное яйцо, чеснок, лук, зира, соль, льняное масло",
      },
      {
        nameAz: "Çayxana aşı",
        nameRu: "Чайханский плов",
        price: 13,
        descriptionAz: "Dana əti, düyü, quyruq, kök sarı, kök qırmızı, kişmiş, bildirçin yumurtası, sarımsaq, soğan, zirə, acı bibər, duz",
        descriptionRu: "Говядина, рис, курдюк, жёлтая морковь, красная морковь, кишмиш, перепелиное яйцо, чеснок, лук, зира, острый перец, соль",
      },
    ],
  },
  {
    nameAz: "Özbək Limonadları",
    nameRu: "Узбекские лимонады",
    nameEn: "Uzbek lemonades",
    dishes: [
      {
        nameAz: "Düşes 1lt qrafin",
        nameRu: "Дюшес 1л графин",
        price: 9,
      },
      {
        nameAz: "Tarxun 1lt qrafin",
        nameRu: "Тархун 1л графин",
        price: 9,
      },
      {
        nameAz: "Nar 1lt qrafin",
        nameRu: "Гранатовый напиток 1л графин",
        price: 9,
      },
      {
        nameAz: "Göy moruğ 1lt qrafin",
        nameRu: "Голубика 1л графин",
        price: 9,
      },
      {
        nameAz: "Moxito lime 1lt qrafin",
        nameRu: "Мохито лайм 1л графин",
        price: 9,
      },
      {
        nameAz: "Moxito çiyələk 1lt qrafin",
        nameRu: "Клубничный мохито 1л графин",
        price: 9,
      },
    ],
  },
  {
    nameAz: "Səhər yeməyi setləri",
    nameRu: "Завтраки",
    nameEn: "Breakfast sets",
    dishes: [
      {
        nameAz: "Səhər yeməy seti 2 nəfərlik",
        nameRu: "Завтрак на 2 персоны",
        price: 30,
        descriptionAz: "Xama, Şor, Kərə yağı, Şokolad yağı, Ağ pendir, Cem, Zeytun, Pomidor və xiyar, Pankake, Kəsmikli bərək, Samsa ət ilə, Yumurta soyutma, Sosiska, Özbək çörəyi, Çay limitsiz + 1 ədəd isti yemək seçim ilə (Kükü, Qlazok, Pomidor yumurta)",
        descriptionRu: "Сметана, сцеженная простокваша, сливочное масло, шоколадное масло, белый сыр, джем, оливки, огурцы и помидоры, панкейк, вареники с творогом, самса мясная, варёные яйца, сосиска, узбекская лепёшка, чай безлимитный + 1 горячее блюдо на выбор (омлет с зеленью, глазок, омлет с помидорами)",
      },
      {
        nameAz: "Səhər yeməy seti 2 nəfərlik",
        nameRu: "Завтрак на 2 персоны",
        price: 50,
        descriptionAz: "Xama, Şor, Kərə yağı, Şokolad yağı, Ağ pendir, Cem, Zeytun, Pomidor və xiyar, Pankake, Kəsmikli bərək, Samsa ət ilə, Yumurta soyutma, Sosiska, Özbək çörəyi, Çay limitsiz + 2 ədəd isti yemək seçim ilə (Kükü, Qlazok, Pomidor yumurta)",
        descriptionRu: "Сметана, сцеженная простокваша, сливочное масло, шоколадное масло, белый сыр, джем, оливки, огурцы и помидоры, панкейк, вареники с творогом, самса мясная, варёные яйца, сосиска, узбекская лепёшка, чай безлимитный + 2 горячее блюдо на выбор (омлет с зеленью, глазок, омлет с помидорами)",
      },
    ],
  },
];

async function main() {
  const slug = process.argv[2] ?? "uzbechka";
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL must be set.");
  }

  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

  const restaurant = await prisma.restaurant.findUnique({ where: { slug }, select: { id: true, name: true } });

  if (!restaurant) {
    throw new Error(`No restaurant with slug "${slug}".`);
  }

  const existing = await prisma.dish.findMany({ where: { restaurantId: restaurant.id }, select: { id: true } });

  // A dish that appears on someone's order cannot be deleted (OrderItem.dish is
  // onDelete: Restrict), and deleting its category would try to. Stop before
  // touching anything rather than fail halfway through.
  const ordered = await prisma.orderItem.findMany({
    where: { dishId: { in: existing.map((dish) => dish.id) } },
    select: { dishId: true },
    distinct: ["dishId"],
  });

  if (ordered.length > 0) {
    throw new Error(
      `${ordered.length} of ${slug}'s dishes appear on past orders and cannot be deleted. ` +
        "Clear that restaurant's orders first, or rewrite those dishes in place.",
    );
  }

  console.log(`${slug}: replacing ${existing.length} dishes with ${MENU.reduce((n, c) => n + c.dishes.length, 0)}.`);

  await prisma.category.deleteMany({ where: { restaurantId: restaurant.id } });

  // The guest menu lists dishes newest first, which would print every section
  // back to front. Stamping each dish a second older than the one above it puts
  // the printed order back — without changing what "newest first" means for
  // every other restaurant.
  const firstStampedAt = Date.now();
  let position = 0;

  for (const category of MENU) {
    const created = await prisma.category.create({
      data: {
        restaurantId: restaurant.id,
        nameAz: category.nameAz,
        nameRu: category.nameRu,
        nameEn: category.nameEn,
      },
    });

    await prisma.dish.createMany({
      data: category.dishes.map((dish) => ({
        restaurantId: restaurant.id,
        categoryId: created.id,
        createdAt: new Date(firstStampedAt - position++ * 1000),
        nameAz: dish.nameAz,
        nameRu: dish.nameRu,
        nameEn: dish.nameAz,
        descriptionAz: dish.descriptionAz ?? "",
        descriptionRu: dish.descriptionRu ?? "",
        descriptionEn: dish.descriptionAz ?? "",
        price: dish.price,
        imageUrl: "",
      })),
    });

    console.log(`  ${category.nameAz}: ${category.dishes.length}`);
  }

  const total = await prisma.dish.count({ where: { restaurantId: restaurant.id } });
  console.log(`Done. ${slug} now has ${total} dishes in ${MENU.length} categories.`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
