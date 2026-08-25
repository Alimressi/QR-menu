// What each GamePoint dish should look like, in one sentence.
//
// The set is generated rather than searched, so the style is not something to
// be recovered afterwards by grading — it is stated once in STYLE below and
// every dish inherits it. That is what makes 92 photographs look like one
// afternoon's work.
//
// Nothing here names a brand. A generated Coca-Cola can comes out with the
// lettering subtly wrong, which looks worse than any stock photo and is someone
// else's trademark besides. Packaged drinks are therefore described as they
// reach the table — in a glass — which is honest, consistent with the food, and
// the way most menus photograph a drink anyway. The bottle on the shelf is a
// photograph the distributor will hand over for free; it is not this script's
// job to counterfeit one.
export const STYLE =
  "on a glossy black surface, warm key light on the food itself, deep electric blue neon glow " +
  "in the dark background, subtle blue rim light along the edges, cinematic gaming lounge mood, " +
  "high contrast, sharp focus, appetising, no text, no logos, no labels, no branding, no people";

// The blue is behind and around the food, never on it. Neon lighting a dish
// directly turns it grey — blue is the one colour food cannot be lit with — so
// the key light stays warm and the neon does the work of matching the menu,
// whose own palette is #2323FF on near black.

export const PROMPTS = {
  // Qəlyanaltılar
  225: "a bowl of freshly popped buttered popcorn",
  226: "a bowl of assorted salted crackers",
  227: "a portion of golden french fries with ketchup",
  228: "golden crispy chicken nuggets in a basket with dipping sauce",
  229: "a bowl of roasted salted peanuts",
  230: "a bowl of golden toasted bread croutons",
  231: "a bowl of crispy potato chips",
  232: "rustic country style potato wedges in a pan",
  233: "a bowl of dushbara dumpling soup with herbs",
  234: "braided string cheese on a wooden board",
  235: "pan fried meat dumplings with dipping sauce",
  236: "thin slices of cured beef basturma on a board",
  237: "grilled sausages on a cast iron plate with herbs",
  // Pizzalar
  905: "a whole margherita pizza with mozzarella and basil",
  906: "a whole chicken pizza with peppers and melted cheese",
  907: "a whole pizza topped with spicy sausage slices",
  908: "a whole mixed pizza with meat, mushrooms and peppers",
  // Kombolar
  256: "a chicken wrap with french fries and a glass of cola",
  257: "a ham sandwich with french fries and a glass of cola",
  258: "a glass of tea, dark chocolate pieces and a hookah on a table",
  259: "a chicken burger with french fries and a glass of cola",
  260: "a shawarma wrap with french fries and a glass of cola",
  261: "chicken nuggets with french fries and a glass of cola",
  262: "a barbecue chicken burger with fries and a glass of cola",
  263: "a cheeseburger with french fries and a glass of cola",
  // Sendviç / Burger
  238: "a toasted sandwich with sausage and melted cheese",
  239: "a toasted sausage sandwich cut in half",
  240: "a ham and cheese sandwich on toasted bread",
  241: "a burger filled with crispy chicken nuggets",
  242: "a barbecue chicken burger with sauce",
  243: "a chicken wrap roll cut in half",
  244: "a shawarma wrap cut in half with grilled chicken and vegetables",
  245: "a hot dog in a soft bun with sauces",
  246: "a cheeseburger with melted cheddar and crisp lettuce",
  // Qəlyanlar
  247: "an elegant hookah shisha pipe glowing in a lounge",
  248: "a hookah with a fresh apple bowl on top",
  249: "a hookah with a grapefruit bowl on top",
  // Pivə — the beer as poured, never the branded bottle
  250: "a tall glass of golden lager beer with thick foam",
  251: "a glass of cloudy unfiltered wheat beer",
  252: "a glass of pale light beer on a bar counter",
  253: "draft beer being poured into a chilled glass",
  254: "a chilled glass of pilsner beer with condensation",
  255: "a glass of pale wheat beer with a slice of orange",
  // Setlər
  300: "a table set with a glass of tea, chocolate and a hookah",
  301: "a sharing platter of shawarma wraps, french fries and glasses of cola",
  302: "a sharing platter of burgers, nuggets, fries and glasses of cola",
  // Soyuq İçkilər — poured, not packaged
  264: "a glass of cola with ice cubes and condensation",
  265: "a small glass of cola with ice",
  266: "a tall glass of cola with ice and a straw",
  267: "a large jug of cola with ice and two glasses",
  268: "a glass of iced tea with a slice of lemon",
  269: "a pitcher of iced lemon tea with mint",
  270: "a glass of energy drink poured over ice",
  271: "a glass of sparkling mineral water with rising bubbles",
  272: "a tall glass of energy drink with ice",
  273: "a tall glass of blue energy drink with ice",
  274: "a tall glass of clear energy drink with ice",
  275: "a glass of ayran yogurt drink with mint",
  276: "a glass of still water with ice",
  277: "a jar of homemade lemonade with lemon and mint",
  // İsti İçkilər
  278: "a teapot and a glass of black tea",
  279: "a traditional armudu glass of black tea",
  280: "a cup of black americano coffee",
  281: "a latte with milk foam art in a cup",
  282: "a glass mug of thick hot chocolate with whipped cream",
  283: "a mug of cocoa topped with marshmallows",
  // Mürəbbə
  288: "a dessert bowl of chocolate caramel peanut ice cream",
  289: "a coconut and chocolate dessert in a bowl",
  290: "a bowl of white cherry preserve with fresh cherries",
  291: "a bowl of strawberry preserve with fresh strawberries",
  292: "scoops of vanilla ice cream in a bowl",
  // Smoothie
  284: "a tall chocolate milkshake in a glass with a straw",
  285: "a banana caramel milkshake in a tall glass",
  286: "a berry smoothie in a glass with fresh berries",
  287: "a strawberry and blackcurrant smoothie in a glass",
  // Şirniyyat
  293: "broken pieces of dark chocolate",
  294: "a chocolate caramel peanut bar broken in half",
  295: "a slice of layered honey cake on a plate",
  296: "profiteroles with chocolate sauce on a plate",
  297: "a bowl of mixed roasted chickpeas and nuts",
  298: "scoops of ice cream in a bowl with chocolate sauce",
  299: "a plate of homemade cookies",
  // Spirtli İçkilər — the pour, never the labelled bottle
  909: "a glass of irish whiskey with ice on a bar",
  910: "a shot glass of dark herbal liqueur on ice",
  911: "tequila shots with lime wedges and salt",
  912: "a glass of whiskey with a large clear ice cube",
  913: "a glass of red wine on a dark table",
  // VIP Setlər — the table, not the glass.
  //
  // What these sell is the spread: a bottle, a fruit platter, four Red Bull, a
  // litre of juice and three hours of the room, for 139 manat. A single glass
  // showed none of that. The bottle stands in the ice bucket without a readable
  // label, which is the one thing generation cannot do honestly.
  914: "a vip lounge table laid for guests: a fruit platter, an ice bucket holding a plain unlabelled bottle, two whiskey glasses on ice, a jug of juice and a hookah",
  915: "a vip lounge table laid for guests: a fruit platter, an ice bucket holding a plain unlabelled bottle, chilled shot glasses of dark herbal liqueur, a jug of juice and a hookah",
  916: "a vip lounge table laid for guests: a fruit platter, an ice bucket holding a plain unlabelled bottle, tequila glasses with lime and salt, a jug of juice and a hookah",
  917: "a vip lounge table laid for guests: a fruit platter, an ice bucket holding a plain unlabelled wine bottle, two wine glasses and a hookah",
  918: "a vip lounge table laid for guests: a fruit platter, a plain unlabelled half bottle on ice, two whiskey glasses, a jug of juice and a hookah",
};
