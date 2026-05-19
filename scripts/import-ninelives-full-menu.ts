import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_DATABASE_URL must be set for the Nine Lives import.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type LocalizedText = {
  nameEn: string;
  nameRu: string;
  nameAz: string;
};

type CategorySeed = LocalizedText;

type DishOptionSeed = LocalizedText & {
  price: number;
};

type DishSeed = LocalizedText & {
  descriptionEn: string;
  descriptionRu: string;
  descriptionAz: string;
  price: number;
  imageUrl: string;
  categoryNameEn: string;
  options?: DishOptionSeed[];
};

const DEFAULT_IMAGE = "/images/dish-1.svg";

function localized(text: string): LocalizedText {
  return {
    nameEn: text,
    nameRu: text,
    nameAz: text,
  };
}

function option(name: string, price: number): DishOptionSeed {
  return {
    ...localized(name),
    price,
  };
}

function makeDish(input: {
  categoryNameEn: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  options?: Array<{ name: string; price: number }>;
}): DishSeed {
  const description = input.description ?? "";

  return {
    ...localized(input.name),
    descriptionEn: description,
    descriptionRu: description,
    descriptionAz: description,
    price: input.price,
    imageUrl: input.imageUrl ?? DEFAULT_IMAGE,
    categoryNameEn: input.categoryNameEn,
    options: input.options?.map((item) => option(item.name, item.price)),
  };
}

const categories: CategorySeed[] = [
  "Salads",
  "Soups",
  "Appetizers",
  "Sandwiches & Burgers",
  "Pasta",
  "Sushi",
  "Main Course",
  "Pizza Menu",
  "Signature Cocktails",
  "Classic Cocktails",
  "Sour",
  "Hot Alcohol",
  "Whiskey",
  "Vodka",
  "Tequila",
  "Gin",
  "Rum",
  "Liqueurs",
  "Aperitive",
  "Beer",
  "Shot Section",
  "Lemonades",
  "Soft Drinks",
  "Coffee",
  "Ice Coffee",
  "Dessert",
  "Local Red Wines",
  "Local White Wine",
  "Local Rose Wine",
  "Wines",
  "Classic Wines",
  "Sparkling Wines",
].map((name) => localized(name));

const dishes: DishSeed[] = [
  makeDish({
    categoryNameEn: "Salads",
    name: "Caesar Salad Chicken/Shrimps/Salmon",
    price: 14,
    description: "Iceberg, parmesan cheese, cherry tomatoes, chicken/shrimps/salmon",
    options: [
      { name: "Chicken", price: 0 },
      { name: "Shrimps", price: 3 },
      { name: "Salmon", price: 6 },
    ],
  }),
  makeDish({
    categoryNameEn: "Salads",
    name: "TEN/11 Salad",
    price: 16,
    description: "Chicken, almond, cherry tomatoes, grapefruit, iceberg",
  }),
  makeDish({
    categoryNameEn: "Salads",
    name: "Thai Salad",
    price: 12,
    description: "Eggplant, sesame, cherry tomatoes, parmesan cheese",
  }),
  makeDish({
    categoryNameEn: "Salads",
    name: "Tomato Salad",
    price: 12,
    description: "Cherry tomatoes, cherries, zogal paste, honey",
  }),
  makeDish({
    categoryNameEn: "Salads",
    name: "Chicken Popcorn Salad",
    price: 16,
    description: "Chicken, corn starch, iceberg, rucola, cherry tomatoes, parmesan cheese, mayonnaise, mustard, honey, peach sauce",
  }),
  makeDish({
    categoryNameEn: "Salads",
    name: "Shrimps Pineapple Salad",
    price: 20,
    description: "Crispy shrimps, iceberg, rucola, sunflower seed, pineapple, lemon, honey, cherry tomatoes, radish",
  }),
  makeDish({
    categoryNameEn: "Soups",
    name: "Lentil soup",
    price: 7,
    description: "Lentil, onion, potato, carrot",
  }),
  makeDish({
    categoryNameEn: "Soups",
    name: "Tomato soup",
    price: 7,
    description: "Tomatoes, cream, parmesan cheese",
  }),
  makeDish({
    categoryNameEn: "Soups",
    name: "Dushbara soup",
    price: 9,
    description: "Flour, beef, butter",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Nuggets",
    price: 11,
    description: "Chicken breast, crumb, ketchup",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Mozarella sticks",
    price: 11,
    description: "Mozarella cheese, crumbs, sweet chili sauce",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Frech fries",
    price: 6,
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Homemade potato",
    price: 7,
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Chicken wings with BBQ sauce",
    price: 12,
    description: "BBQ sauce, sesame, crispy wings",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Bruschetta Tomato/Salmon",
    price: 12,
    description: "Parmesan cheese, black olives, green olives, cherry tomatoes, cream cheese, pesto sauce",
    options: [
      { name: "Tomato", price: 0 },
      { name: "Salmon", price: 6 },
    ],
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Crispy Wings",
    price: 13,
    description: "Crispy wings, queen marry sauce, red cabbage, sesame seeds",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Taco Chicken/Meat",
    price: 17,
    description: "Colored pepper, red onion, parmesan cheese, iceberg, tacos sauce, chicken/beef",
    options: [
      { name: "Chicken", price: 0 },
      { name: "Meat", price: 2 },
    ],
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Tempura Shrimps",
    price: 18,
    description: "Shrimps, crumbs",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Fruit plate",
    price: 18,
    description: "Seasonal fruits",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Cheese Platter",
    price: 24,
    description: "Mozzarella cheese, holland cheese, white cheese, fruit, crackers, pigtail cheese, cheddar cheese, parmesan cheese",
  }),
  makeDish({
    categoryNameEn: "Appetizers",
    name: "Chicken Strips",
    price: 11,
    description: "Chicken, corn flour, vinegar, mustard, sweet chili sauce, mayonnaise, sriracha sauce",
  }),
  makeDish({
    categoryNameEn: "Sandwiches & Burgers",
    name: "Club Sandwich Chicken/Salmon",
    price: 12,
    description: "Tomato, cucumber, iceberg, cheddar cheese, chicken/salmon, french fries",
    options: [
      { name: "Chicken", price: 0 },
      { name: "Salmon", price: 4 },
    ],
  }),
  makeDish({
    categoryNameEn: "Sandwiches & Burgers",
    name: "Meat Burger",
    price: 14,
    description: "Red onion, iceberg, tomatoes, cheddar cheese, cucumber, beef, french fries",
  }),
  makeDish({
    categoryNameEn: "Sandwiches & Burgers",
    name: "Zinger Burger",
    price: 13,
    description: "Crispy chicken, cheddar cheese, cucumber, iceberg, french fries, Ten/11 sauce",
  }),
  makeDish({
    categoryNameEn: "Sandwiches & Burgers",
    name: "Black Burger",
    price: 17,
    description: "Beef, cucumber, tomatoes, iceberg, double cheddar cheese, onion rings, french fries",
  }),
  makeDish({
    categoryNameEn: "Sandwiches & Burgers",
    name: "Rock'n Roll",
    price: 14,
    description: "Beef, cucumber, iceberg, cheddar cheese, crispy bread, bell pepper, onions, french fries",
  }),
  makeDish({
    categoryNameEn: "Sandwiches & Burgers",
    name: "Vegan Burger",
    price: 11,
    description: "Stuffed cutlet, iceberg, tomatoes, cucumber, french fries",
  }),
  makeDish({
    categoryNameEn: "Pasta",
    name: "Noodle Pasta Chicken/Meat",
    price: 13,
    description: "Noodles, squash, red cabbage, colored peppers, carrot, chicken/beef",
    options: [
      { name: "Chicken", price: 0 },
      { name: "Meat", price: 1 },
    ],
  }),
  makeDish({
    categoryNameEn: "Pasta",
    name: "Noodle Carry Chicken/Shrimps",
    price: 16,
    description: "Noodles, curry sauce, chicken/shrimp",
    options: [
      { name: "Chicken", price: 0 },
      { name: "Shrimps", price: 2 },
    ],
  }),
  makeDish({
    categoryNameEn: "Pasta",
    name: "Fettuccini Alfredo",
    price: 15,
    description: "Mushroom, parmesan cheese, cream, chicken",
  }),
  makeDish({
    categoryNameEn: "Pasta",
    name: "Mac & Cheese",
    price: 13,
    description: "Mozzarella cheese, cream, parmesan cheese, macaroni",
  }),
  makeDish({
    categoryNameEn: "Pasta",
    name: "Chefs Special",
    price: 15,
    description: "Mozzarella cheese, macaroni, black olives, chicken, onion, bell pepper",
  }),
  makeDish({
    categoryNameEn: "Sushi",
    name: "Philadelphia",
    price: 12.5,
    description: "8 pieces. Cream cheese, cucumber, smoked salmon, sesame",
  }),
  makeDish({
    categoryNameEn: "Sushi",
    name: "California",
    price: 11.5,
    description: "8 pieces. Rice, avocado, tobiko sauce, nori",
  }),
  makeDish({
    categoryNameEn: "Sushi",
    name: "California Ebi",
    price: 12,
    description: "8 pieces. Cream cheese, cucumber, tempura shrimps, tobiko sauce",
  }),
  makeDish({
    categoryNameEn: "Sushi",
    name: "California Smoked Salmon",
    price: 13,
    description: "8 pieces. Cream cheese, cucumber, smoked salmon, sesame",
  }),
  makeDish({
    categoryNameEn: "Sushi",
    name: "Crab Maki",
    price: 8,
    description: "8 pieces. Crab, rice",
  }),
  makeDish({
    categoryNameEn: "Sushi",
    name: "Kappa Maki",
    price: 5.5,
    description: "8 pieces. Cucumber, rice, sesame",
  }),
  makeDish({
    categoryNameEn: "Sushi",
    name: "Avocado Maki",
    price: 5.5,
    description: "8 pieces. Avocado, rice",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "French Beef/Chicken",
    price: 18,
    description: "Chicken/beef, tomato, mushrooms, butter, parmesan, gauda cheese, mayonnaise, rucola, pesto sauce",
    options: [
      { name: "Beef", price: 0 },
      { name: "Chicken", price: 4 },
    ],
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Chicken curry",
    price: 24,
    description: "Curry sauce, chicken, rise",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Biryani Chicken",
    price: 24,
    description: "Indian spices, chicken, mint, coriander leave, rice",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Mutton Curry",
    price: 28,
    description: "Curry sauce, mutton, rice",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Mutton Biryani",
    price: 28,
    description: "Indian spices, mint, coriander leave, mutton, rice",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Chicken Pineapple",
    price: 20,
    description: "Chicken, pineapple, garlic, honey, corn starch, onion, parsley",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Cafe De Paris Chicken/Meat",
    price: 16,
    description: "Cafe de Paris sauce, cream, homemade potato, chicken/meat",
    options: [
      { name: "Chicken", price: 0 },
      { name: "Meat", price: 4 },
    ],
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Chicken Special Schnitzel",
    price: 15,
    description: "Mushroom sauce, butter stuffed chicken, crumbs, homemade potatoes",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Beef Medallion",
    price: 25,
    description: "Beef, squash, colored peppers, demi glace sauce, bread",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Beef Stroganoff",
    price: 18,
    description: "Beef, mushroom, mustard, cream, cream cheese, worchestershire sauce, homemade potato",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Chicken Stroganoff",
    price: 15,
    description: "Chicken, mushroom, mustard, cream, cream cheese, worchestershire sauce, homemade potato",
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Beef/Chicken With Mushrooms",
    price: 17,
    description: "Beef/chicken, butter, onion, garlic, mushrooms, cream, milk",
    options: [
      { name: "Beef", price: 0 },
      { name: "Chicken", price: 4 },
    ],
  }),
  makeDish({
    categoryNameEn: "Main Course",
    name: "Duck with Orange",
    price: 30,
    description: "Duck breast, orange, red onion, butter, corn starch",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Margarita",
    price: 11,
    description: "Pizza sauce, mozzarella cheese",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Fungi Pizza",
    price: 12,
    description: "Pizza sauce, mozzarella cheese, mushrooms",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Chickrn Fungi Pizza",
    price: 14,
    description: "Pizza sauce, mozzarella cheese, chicken, mushrooms",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Chicken BBQ",
    price: 15,
    description: "Pizza sauce, mozzarella cheese, chicken, BBQ sauce",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Pear Blue",
    price: 15,
    description: "Cream, mozzarella cheese, pear, dona blue cheese",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Caesar",
    price: 17,
    description: "Caesar sauce, mozzarella cheese, chicken, cherry tomatoes, paemesan cheese, iceberg",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Salami",
    price: 16,
    description: "Pizza sauce, mozzarella cheese, salami",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Salami Halal",
    price: 16,
    description: "Pizza sauce, mozzarella cheese, salami halal",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Beef Italian",
    price: 18,
    description: "Pizza sauce, mozzarella cheese, red onion, bell pepper, black olives, beef",
  }),
  makeDish({
    categoryNameEn: "Pizza Menu",
    name: "Pizza Salmon",
    price: 19,
    description: "Cream, mozzarella cheese, salmon, cherry tomatoes, capers, rucola, parmesan cheese",
  }),
  makeDish({
    categoryNameEn: "Signature Cocktails",
    name: "Jucy",
    price: 16,
  }),
  makeDish({
    categoryNameEn: "Signature Cocktails",
    name: "My passion",
    price: 16,
  }),
  makeDish({
    categoryNameEn: "Signature Cocktails",
    name: "Tom & Jerry",
    price: 16,
  }),
  makeDish({
    categoryNameEn: "Signature Cocktails",
    name: "Alina",
    price: 15,
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Long island iced tea",
    price: 16,
    description: "Vodka, bacardi, tequil, gin, triple sec, cola",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Long ialand energy",
    price: 18,
    description: "Vodka, bacardi, tequil, gin, triple sec, energy",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Mai-Tai",
    price: 16,
    description: "Rum white, rum gold, rum dark, lemon fresh, almond syrup",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Margarita",
    price: 14,
    description: "Tequila, lemon fresh, triple sec",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Cosmopolitan",
    price: 13,
    description: "Vodka, triple sec, lemon fresh, grenadine",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Sex on the beach",
    price: 13,
    description: "Vodka, orange juice, cranberry juice, grenadine",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Negroni",
    price: 15,
    description: "Gin, red vermout, angostura",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Manhattan",
    price: 15,
    description: "Bourbon, red vermout, angostura",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "White Russian",
    price: 15,
    description: "Kahlua, vodka, cream",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Black Russian",
    price: 12,
    description: "Kahlua, vodka",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Gin tonic",
    price: 13,
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Cuba Libre",
    price: 13,
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Aperol spritz",
    price: 15,
    description: "Aperol, prosecco, soda water",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Godfather",
    price: 14,
    description: "Scotch, amaretto",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Old fashion",
    price: 14,
    description: "Bourbon, angostura, water, syrup",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Espresso martini",
    price: 14,
    description: "Kahlua, vodka",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Daiquiri",
    price: 13,
    description: "Rum, lemon fresh, syrup",
  }),
  makeDish({
    categoryNameEn: "Classic Cocktails",
    name: "Gin fizz",
    price: 13,
    description: "Gin, syrup, lemon fresh",
  }),
  makeDish({
    categoryNameEn: "Sour",
    name: "Whiskey Sour",
    price: 15,
    description: "Bourbon, syrup, egg white",
  }),
  makeDish({
    categoryNameEn: "Sour",
    name: "Gin Sour",
    price: 15,
    description: "Gin, lemon fresh, syrup, egg white",
  }),
  makeDish({
    categoryNameEn: "Hot Alcohol",
    name: "Irish Coffee",
    price: 14,
  }),
  makeDish({
    categoryNameEn: "Hot Alcohol",
    name: "Bailey's Coffee",
    price: 14,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Jack daniel's old n.7",
    price: 12,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Jack daniel's honey",
    price: 12,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Jack daniel's apple",
    price: 12,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Glenfiddich",
    price: 15,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Monkey shoulder",
    price: 15,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Jameson",
    price: 11,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Chivas regal 12",
    price: 13,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Macallan",
    price: 20,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Black label",
    price: 12,
  }),
  makeDish({
    categoryNameEn: "Whiskey",
    name: "Red label",
    price: 14,
  }),
  makeDish({
    categoryNameEn: "Vodka",
    name: "Finlandia",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Vodka",
    name: "Grey Goose",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Vodka",
    name: "Absolut",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Tequila",
    name: "Olmeca silver",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Tequila",
    name: "Sombrero",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Tequila",
    name: "Patron silver",
    price: 14,
  }),
  makeDish({
    categoryNameEn: "Tequila",
    name: "Sierra",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Gin",
    name: "Gordon's",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Gin",
    name: "Bombay",
    price: 12,
  }),
  makeDish({
    categoryNameEn: "Gin",
    name: "Hendrick's",
    price: 13,
  }),
  makeDish({
    categoryNameEn: "Rum",
    name: "Bacardi White",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Rum",
    name: "Bacardi Black",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Rum",
    name: "Captain Morgan Gold",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Rum",
    name: "Captain Morgan Dark",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Liqueurs",
    name: "Jägermeister",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Liqueurs",
    name: "Disaronno",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Liqueurs",
    name: "Kahlua",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Liqueurs",
    name: "Bailey's",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Liqueurs",
    name: "Sambuca",
    price: 11,
  }),
  makeDish({
    categoryNameEn: "Liqueurs",
    name: "Absinthe",
    price: 11,
  }),
  makeDish({
    categoryNameEn: "Aperitive",
    name: "Martini rosso",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Aperitive",
    name: "Martini bianco",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Aperitive",
    name: "Martini extra dry",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Aperitive",
    name: "Martini fiero",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Aperitive",
    name: "Prosecco",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Beer",
    name: "Heineken",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Beer",
    name: "Guinness",
    price: 14,
  }),
  makeDish({
    categoryNameEn: "Beer",
    name: "Corona",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Beer",
    name: "Efes draft",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Beer",
    name: "Efes Pilsener",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Shot Section",
    name: "Ocean 6 pcs",
    price: 18,
    description: "Vodka, juice, lemon fresh",
  }),
  makeDish({
    categoryNameEn: "Shot Section",
    name: "Tequila set 6 pcs",
    price: 20,
    description: "Tequil, juice, lemon fresh",
  }),
  makeDish({
    categoryNameEn: "Shot Section",
    name: "Tequila set 10 pcs",
    price: 60,
  }),
  makeDish({
    categoryNameEn: "Shot Section",
    name: "Jagermeister 10 pcs",
    price: 65,
  }),
  makeDish({
    categoryNameEn: "Shot Section",
    name: "Only for you 6 pcs",
    price: 22,
  }),
  makeDish({
    categoryNameEn: "Lemonades",
    name: "Aloe Passion",
    price: 10,
    description: "Energy",
  }),
  makeDish({
    categoryNameEn: "Lemonades",
    name: "Mango Fizz",
    price: 10,
    description: "Energy",
  }),
  makeDish({
    categoryNameEn: "Lemonades",
    name: "Strawberry ale",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Lemonades",
    name: "Violet ale",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Lemonades",
    name: "Ice Tea",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Lemonades",
    name: "Milk Shake",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Soft Drinks",
    name: "Coca-Cola",
    price: 5,
    description: "Normal/Zero",
  }),
  makeDish({
    categoryNameEn: "Soft Drinks",
    name: "Tonic",
    price: 5,
  }),
  makeDish({
    categoryNameEn: "Soft Drinks",
    name: "Juice",
    price: 4,
  }),
  makeDish({
    categoryNameEn: "Soft Drinks",
    name: "Water still",
    price: 4,
  }),
  makeDish({
    categoryNameEn: "Soft Drinks",
    name: "Water sparkling",
    price: 4,
  }),
  makeDish({
    categoryNameEn: "Soft Drinks",
    name: "Redbull",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Coffee",
    name: "Espresso",
    price: 6,
    description: "Single",
    options: [{ name: "Double", price: 1 }],
  }),
  makeDish({
    categoryNameEn: "Coffee",
    name: "Lungo",
    price: 6,
  }),
  makeDish({
    categoryNameEn: "Coffee",
    name: "Cappuccino",
    price: 8,
  }),
  makeDish({
    categoryNameEn: "Coffee",
    name: "Latte",
    price: 8,
  }),
  makeDish({
    categoryNameEn: "Coffee",
    name: "Mocha",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Coffee",
    name: "Raf",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Coffee",
    name: "Americano",
    price: 5,
  }),
  makeDish({
    categoryNameEn: "Ice Coffee",
    name: "Ice latte",
    price: 8,
  }),
  makeDish({
    categoryNameEn: "Ice Coffee",
    name: "Ice Americano",
    price: 5,
  }),
  makeDish({
    categoryNameEn: "Ice Coffee",
    name: "Bambl.",
    price: 8,
  }),
  makeDish({
    categoryNameEn: "Ice Coffee",
    name: "Ice Mocha",
    price: 10,
  }),
  makeDish({
    categoryNameEn: "Dessert",
    name: "Tiramisu",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Dessert",
    name: "Cheesecake",
    price: 9,
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Meysari Makhmari (Red Dry)",
    price: 12,
    options: [{ name: "Bottle", price: 34 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Meysari Marcan (Red Dry)",
    price: 11,
    options: [{ name: "Bottle", price: 29 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Meysari Inmabi (Red Dry)",
    price: 11,
    options: [{ name: "Bottle", price: 29 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Chabiant (Red Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Chabiant (Red Semi Sweet)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Chabiant (Red Semi Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Piano Madrasa Cabernet-Sauvignon (Red Semi Sweet)",
    price: 8,
    options: [{ name: "Bottle", price: 22 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Piano Cabernet Sauvignon (Red Dry)",
    price: 8,
    options: [{ name: "Bottle", price: 22 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Piano Pomegranate (Semi Sweet)",
    price: 8,
    options: [{ name: "Bottle", price: 22 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Heritage Cabernet Sauvignon (Red Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Heritage Cuve (Red Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Heritage Merlot (Red Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Savalan Cabernet Merlot (Red Semi Sweet)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Savalan Aliateco (Red Semi Sweet)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Red Wines",
    name: "Savalan Merlot (Red Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Meysari Sadaf (White dry)",
    price: 11,
    options: [{ name: "Bottle", price: 29 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Meysari Billuri (White dry)",
    price: 11,
    options: [{ name: "Bottle", price: 29 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Chabiant (White dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Chabiant (White Semi Sweet)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Chabiant (White Semi Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Piano Chardonnay (White dry)",
    price: 8,
    options: [{ name: "Bottle", price: 22 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Piano Rkatsiteli (White Semi Sweet)",
    price: 8,
    options: [{ name: "Bottle", price: 22 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Heritage Bayanshira (White dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Heritage Cuve (White dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Heritage Sauvignon Blanc (White dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Savalan Moscato (White Semi Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local White Wine",
    name: "Savalan Sauvignon Blanc (White dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Rose Wine",
    name: "Meysari Sanam Rose (Dry)",
    price: 11,
    options: [{ name: "Bottle", price: 29 }],
  }),
  makeDish({
    categoryNameEn: "Local Rose Wine",
    name: "Chabiant (Rose Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Rose Wine",
    name: "Savalan (Rose Dry)",
    price: 9,
    options: [{ name: "Bottle", price: 26 }],
  }),
  makeDish({
    categoryNameEn: "Local Rose Wine",
    name: "Piano Cabernet Sauvignon (Rose Dry)",
    price: 8,
    options: [{ name: "Bottle", price: 22 }],
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Merlot",
    price: 45,
    description: "Red Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Cabernet Sauvignon",
    price: 45,
    description: "Red Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Shiraz",
    price: 45,
    description: "Red Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Shiraz Cabernet",
    price: 45,
    description: "Red Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Semillion Chardonnay",
    price: 45,
    description: "White Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Riesling",
    price: 45,
    description: "White Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Chardonnay",
    price: 45,
    description: "White Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Sauvignon Blanc",
    price: 45,
    description: "White Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Classic Chardonay Reserve",
    price: 60,
    description: "White Dry",
  }),
  makeDish({
    categoryNameEn: "Wines",
    name: "Jacobs Creek Shiraz Reserve",
    price: 60,
    description: "Red Dry",
  }),
  makeDish({
    categoryNameEn: "Classic Wines",
    name: "Chabiant Classic Madrasa",
    price: 9,
    description: "Rose dry",
    options: [{ name: "Bottle", price: 30 }],
  }),
  makeDish({
    categoryNameEn: "Classic Wines",
    name: "Chabiant Classic Madrasa",
    price: 9,
    description: "Red dry",
    options: [{ name: "Bottle", price: 30 }],
  }),
  makeDish({
    categoryNameEn: "Classic Wines",
    name: "Chabiant Classic Bayan Shira",
    price: 9,
    description: "White dry",
    options: [{ name: "Bottle", price: 30 }],
  }),
  makeDish({
    categoryNameEn: "Sparkling Wines",
    name: "Bottega Brut",
    price: 60,
  }),
  makeDish({
    categoryNameEn: "Sparkling Wines",
    name: "Bottega Gold",
    price: 95,
  }),
  makeDish({
    categoryNameEn: "Sparkling Wines",
    name: "Bottega Rose Gold",
    price: 95,
  }),
  makeDish({
    categoryNameEn: "Sparkling Wines",
    name: "Jacobs Creek Classic Pinot Noir Red",
    price: 45,
  }),
  makeDish({
    categoryNameEn: "Sparkling Wines",
    name: "Abrau Brut White",
    price: 45,
  }),
  makeDish({
    categoryNameEn: "Sparkling Wines",
    name: "Bottega Poeti Prosecco Rose",
    price: 60,
  }),
  makeDish({
    categoryNameEn: "Sparkling Wines",
    name: "Abrau Durso Victor Dravigniy Semi Sweet",
    price: 45,
  }),
];

async function ensureRestaurant() {
  return prisma.restaurant.upsert({
    where: { slug: "ninelives" },
    update: {
      name: "Nine Lives Bar",
      logoUrl: "/images/logo.svg",
      settings: JSON.stringify({
        theme: "dark",
        primaryColor: "#b8944f",
        photoSize: "normal",
      }),
    },
    create: {
      name: "Nine Lives Bar",
      slug: "ninelives",
      logoUrl: "/images/logo.svg",
      settings: JSON.stringify({
        theme: "dark",
        primaryColor: "#b8944f",
        photoSize: "normal",
      }),
    },
  });
}

async function upsertCategory(restaurantId: number, category: CategorySeed) {
  const existing = await prisma.category.findFirst({
    where: {
      restaurantId,
      nameEn: category.nameEn,
    },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: {
        nameRu: category.nameRu,
        nameAz: category.nameAz,
      },
    });
  }

  return prisma.category.create({
    data: {
      restaurantId,
      ...category,
    },
  });
}

async function upsertDish(restaurantId: number, categoryId: number, dish: DishSeed) {
  const existing = await prisma.dish.findFirst({
    where: {
      restaurantId,
      categoryId,
      nameEn: dish.nameEn,
      descriptionEn: dish.descriptionEn,
      price: dish.price,
    },
  });

  const payload = {
    categoryId,
    nameRu: dish.nameRu,
    nameAz: dish.nameAz,
    descriptionEn: dish.descriptionEn,
    descriptionRu: dish.descriptionRu,
    descriptionAz: dish.descriptionAz,
    price: dish.price,
    imageUrl: dish.imageUrl,
    imagePositionX: 50,
    imagePositionY: 50,
  };

  if (existing) {
    await prisma.dishOption.deleteMany({ where: { dishId: existing.id } });

    return prisma.dish.update({
      where: { id: existing.id },
      data: {
        ...payload,
        options: dish.options?.length
          ? {
              create: dish.options,
            }
          : undefined,
      },
    });
  }

  return prisma.dish.create({
    data: {
      restaurantId,
      categoryId,
      nameEn: dish.nameEn,
      nameRu: dish.nameRu,
      nameAz: dish.nameAz,
      descriptionEn: dish.descriptionEn,
      descriptionRu: dish.descriptionRu,
      descriptionAz: dish.descriptionAz,
      price: dish.price,
      imageUrl: dish.imageUrl,
      imagePositionX: 50,
      imagePositionY: 50,
      options: dish.options?.length
        ? {
            create: dish.options,
          }
        : undefined,
    },
  });
}

async function main() {
  const restaurant = await ensureRestaurant();

  await prisma.category.deleteMany({
    where: { restaurantId: restaurant.id },
  });

  const categoryMap = new Map<string, number>();

  for (const category of categories) {
    const savedCategory = await upsertCategory(restaurant.id, category);
    categoryMap.set(savedCategory.nameEn, savedCategory.id);
  }

  const dishesByCategory = new Map<string, DishSeed[]>();
  for (const category of categories) {
    dishesByCategory.set(category.nameEn, []);
  }
  for (const dish of dishes) {
    const grouped = dishesByCategory.get(dish.categoryNameEn);
    if (!grouped) {
      throw new Error(`Missing category bucket for dish ${dish.nameEn}: ${dish.categoryNameEn}`);
    }
    grouped.push(dish);
  }

  for (const category of categories) {
    const categoryId = categoryMap.get(category.nameEn);

    if (!categoryId) {
      throw new Error(`Missing category record: ${category.nameEn}`);
    }

    const categoryDishes = dishesByCategory.get(category.nameEn) ?? [];

    for (const dish of [...categoryDishes].reverse()) {
      await upsertDish(restaurant.id, categoryId, dish);
    }
  }

  console.log(`[import] Nine Lives synced: ${categories.length} categories, ${dishes.length} dishes.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
