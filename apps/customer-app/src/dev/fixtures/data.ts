export type FoodCategory =
  "Popular" | "Starters" | "Mains" | "Breads" | "Drinks" | "Desserts";

export interface CustomerMenuItem {
  id: string;
  category: Exclude<FoodCategory, "Popular">;
  name: string;
  description: string;
  price: number;
  image: string;
  foodType: "VEG" | "NON_VEG";
  spice?: "MILD" | "MEDIUM" | "HOT";
  popular?: boolean;
  options?: Array<{ id: string; name: string; price: number }>;
}

export const restaurant = {
  name: "The Panorama",
  subtitle: "Modern Indian Kitchen",
  table: "T12",
  area: "Indoor Dining",
  estimatedTime: "20–25 min",
};

export const categories: FoodCategory[] = [
  "Popular",
  "Starters",
  "Mains",
  "Breads",
  "Drinks",
  "Desserts",
];

export const menu: CustomerMenuItem[] = [
  {
    id: "paneer-tikka",
    category: "Starters",
    name: "Paneer Tikka",
    description: "Charred cottage cheese, peppers and house tandoori marinade.",
    price: 280,
    image:
      "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=900&q=80",
    foodType: "VEG",
    spice: "MILD",
    popular: true,
  },
  {
    id: "chicken-biryani",
    category: "Mains",
    name: "Chicken Biryani",
    description:
      "Fragrant basmati, slow-cooked chicken, saffron and fried onions.",
    price: 350,
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=900&q=80",
    foodType: "NON_VEG",
    spice: "MEDIUM",
    popular: true,
    options: [
      { id: "raita", name: "Add Raita", price: 40 },
      { id: "egg", name: "Add Egg", price: 30 },
    ],
  },
  {
    id: "butter-chicken",
    category: "Mains",
    name: "Butter Chicken",
    description:
      "Tandoori chicken in a silky tomato, butter and fenugreek sauce.",
    price: 390,
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80",
    foodType: "NON_VEG",
    spice: "MILD",
    popular: true,
  },
  {
    id: "garlic-naan",
    category: "Breads",
    name: "Garlic Naan",
    description: "Clay-oven naan finished with garlic, coriander and butter.",
    price: 70,
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80",
    foodType: "VEG",
    options: [{ id: "cheese", name: "Add Cheese", price: 40 }],
  },
  {
    id: "masala-chai",
    category: "Drinks",
    name: "Masala Chai",
    description: "Freshly brewed tea with ginger, cardamom and warming spices.",
    price: 90,
    image:
      "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80",
    foodType: "VEG",
  },
  {
    id: "gulab-jamun",
    category: "Desserts",
    name: "Gulab Jamun",
    description: "Warm milk dumplings, rose syrup and vanilla ice cream.",
    price: 160,
    image:
      "https://images.unsplash.com/photo-1666190094762-1b6c5b6c9c0a?auto=format&fit=crop&w=900&q=80",
    foodType: "VEG",
  },
];
