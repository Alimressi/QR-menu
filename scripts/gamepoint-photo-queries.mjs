// What to search Pexels for, per GamePoint dish.
//
// The dish names are Azerbaijani and several are brand names, so searching on
// them directly returns nothing useful ("Sacaqlı Pendir", "Qızardılmış Gürza").
// Each dish carries a hand-written English query instead. Shared by the fetch
// script and the regrade pass so the two can never drift apart.

export const QUERIES = {
  // Qəlyanaltılar
  225: "popcorn bowl",
  226: "salty crackers snack bowl",
  227: "french fries",
  228: "chicken nuggets",
  229: "roasted peanuts bowl",
  230: "toasted bread cubes bowl",
  231: "potato chips bowl",
  232: "country style potato wedges",
  233: "dumpling soup dushbara",
  234: "sliced cheese board",
  235: "fried dumplings gyoza",
  236: "basturma cured meat slices",
  237: "grilled sausages plate",
  // Sendviç / Burger
  238: "sausage cheese toast sandwich",
  239: "sausage toast sandwich",
  240: "ham sandwich",
  241: "chicken nugget burger",
  242: "bbq chicken burger",
  243: "chicken wrap roll",
  244: "shawarma doner wrap",
  245: "hot dog",
  246: "cheeseburger",
  // Qəlyanlar
  247: "hookah close up smoke",
  248: "hookah apple shisha",
  249: "hookah grapefruit shisha",
  // Pivə
  250: "lager beer glass",
  251: "unfiltered beer glass",
  252: "non alcoholic beer bottle",
  253: "draft beer pouring",
  254: "pilsner beer glass",
  255: "wheat beer glass",
  // Kombolar
  256: "chicken wrap fries cola meal",
  257: "burger fries cola combo meal",
  258: "hookah lounge table with tea",
  259: "chicken nuggets fries cola",
  260: "shawarma fries cola meal",
  261: "chicken nuggets fries drink",
  262: "bbq burger fries drink meal",
  263: "cheeseburger fries cola meal",
  // Soyuq İçkilər
  264: "cola soda can",
  265: "glass of cola with ice",
  266: "cola bottle on table",
  267: "soda bottle one liter",
  268: "iced tea can",
  269: "iced lemon tea in bottle",
  270: "energy drink can",
  271: "sparkling water bottle",
  272: "blank aluminium drink can dark background",
  273: "blank aluminium can blue background",
  274: "energy drink can white",
  275: "turkish ayran",
  276: "mineral water bottle",
  277: "homemade lemonade jar",
  // İsti İçkilər
  278: "black tea teapot",
  279: "cup of tea",
  280: "americano coffee cup",
  281: "latte coffee with milk",
  282: "hot chocolate glass mug",
  283: "cocoa with marshmallows",
  // Smoothie
  284: "milkshake glass",
  285: "banana caramel milkshake",
  286: "berry smoothie glass",
  287: "strawberry smoothie glass",
  // Mürəbbə
  288: "chocolate caramel peanut ice cream",
  289: "coconut chocolate dessert",
  290: "white cherry dessert bowl",
  291: "strawberry dessert bowl",
  292: "vanilla ice cream scoops",
  // Şirniyyat
  293: "chocolate bar pieces",
  294: "chocolate caramel peanut bar",
  295: "honey cake slice",
  296: "profiteroles dessert",
  297: "roasted chickpeas and nuts mix",
  298: "ice cream scoop cone",
  299: "cookies plate",
  // Pizzalar
  905: "margherita pizza",
  906: "chicken pizza",
  907: "sausage pepperoni pizza",
  908: "mixed toppings pizza",
  // Spirtli İçkilər
  909: "whiskey bottle and glass on table",
  910: "herbal liqueur bottle dark",
  911: "tequila bottle with lime and salt",
  912: "whiskey bottle on bar",
  913: "red wine bottle and glass",
  // VIP Setlər
  914: "whiskey bottle with fruit platter",
  915: "liqueur bottle with fruit plate",
  916: "tequila bottle with fruit platter",
  917: "wine bottle with fruit plate",
  918: "whiskey bottle hookah lounge table",
  // Setlər
  300: "hookah lounge interior table",
  301: "shawarma fries cola set",
  302: "burger nuggets fries cola set",
};

// Names that did not say plainly what the dish is — the query is a guess.
export const UNSURE = new Set([226, 288, 289, 290, 291, 299]);

// Branded products: the photo shows the kind of drink or bar, not the brand.
// Stock libraries do not carry brand photography, and using it on a menu would
// be a trademark problem rather than a licensing one.
export const BRANDED = new Set([264, 265, 266, 267, 268, 269, 270, 272, 273, 274, 276, 271, 250, 251, 252, 253, 254, 255, 288, 289, 294]);
