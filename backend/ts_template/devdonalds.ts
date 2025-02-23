import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook = new Map<string, cookbookEntry>();

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  if (!recipeName.match(/[a-zA-Z]/)) {
      return null;
  }
  recipeName = recipeName.replace(/[-_]+/g, ' ');
  recipeName = recipeName.replace(/[^a-zA-Z\s]/g, '');
  let words = recipeName.split(" ");
  words = words.filter(word => word !== "");
  
  if (words.length === 0) {
      return null;
  }
  let finalWords = [];
  for (let word of words) {
      let newWord = word.toLowerCase();
      newWord = newWord.charAt(0).toUpperCase() + newWord.slice(1);
      finalWords.push(newWord);
  }
  return finalWords.join(" ");
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const entry = req.body;
  if (entry.type !== "recipe" && entry.type !== "ingredient") {
    return res.status(400).send("Invalid type");
  }
  if (cookbook.has(entry.name)) {
    return res.status(400).send("Entry name must be unique");
  }

  if (entry.type === "ingredient") {
    const ingredientEntry = entry as ingredient;
    if (typeof ingredientEntry.cookTime !== "number" || ingredientEntry.cookTime < 0) {
      return res.status(400).send("cookTime must be greater than or equal to 0");
    }
  } else {
    const recipeEntry = entry as recipe;
    const itemNames = new Set<string>();
    for (const item of recipeEntry.requiredItems) {
      if (itemNames.has(item.name)) {
        return res.status(400).send("Recipe requiredItems must have unique names");
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return res.status(400).send("Item quantity must be a positive number");
      }
      itemNames.add(item.name);
    }
  }
  cookbook.set(entry.name, entry);
  return res.status(200).send();

});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req: Request, res: Response) => { 
  const name = req.query.name as string;
  const entry = cookbook.get(name);
  if (!entry) {
    return res.status(400).send("Can't find that recipe!");
  }
  if (entry.type !== "recipe") {
    return res.status(400).send("That's not a recipe!");
  }
  let totalCookTime = 0;
  const ingredients: requiredItem[] = [];
  const seenIngredients = new Map<string, number>();

  const processRecipe = (recipe: recipe, multiplier: number) => {
    for (const item of recipe.requiredItems) {
      const subEntry = cookbook.get(item.name);
      if (!subEntry) {
        throw new Error("Missing ingredient!");
      }

      if (subEntry.type === "ingredient") {
        const ing = subEntry as ingredient;
        totalCookTime += ing.cookTime * item.quantity * multiplier;
        
        const currentQty = seenIngredients.get(item.name) || 0;
        seenIngredients.set(item.name, currentQty + (item.quantity * multiplier));
      } else {
        processRecipe(subEntry as recipe, item.quantity * multiplier);
      }
    }
  };

  try {
    processRecipe(entry as recipe, 1);
    seenIngredients.forEach((qty, name) => {
      ingredients.push({ name, quantity: qty });
    });
    ingredients.sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      name: name,
      cookTime: totalCookTime,
      ingredients: ingredients
    });

  } catch (error) {
    return res.status(400).send(error.message);
  }
});

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
