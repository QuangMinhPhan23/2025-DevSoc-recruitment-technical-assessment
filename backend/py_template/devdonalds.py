from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int


# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
cookbook = {}

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that 
def parse_handwriting(recipeName: str) -> Union[str | None]:
	goodRecipeName = ''
	t = False
	for cha in recipeName:
		if len(goodRecipeName) != 0:
			lastCha = goodRecipeName[-1]
		else:
			lastCha = 'anything'
		if cha == '-' or cha == '_' or cha == ' ':
			if lastCha != ' ':						# So that there is just one space
				goodRecipeName += ' '
		elif cha.isalpha():
			if t == False:							# Uppercase the first letter
				goodRecipeName += cha.upper()
				t = True
			elif lastCha == ' ':
				goodRecipeName += cha.upper()		# Uppercase the first letter of a word
			else:
				goodRecipeName += cha.lower()		# Lowercase the rest of the letters
    
	if len(goodRecipeName) == 0:
		return None
	recipeName = goodRecipeName
	return recipeName


# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	data = request.get_json()
	entries_type = data.get('type', '')
	entries_name = data.get('name', '')
	if entries_type != 'recipe' and entries_type != 'ingredient':
		return 'Invalid type', 400
	if entries_name in cookbook:
		return 'Entry names already exists', 400
	if entries_type == 'ingredient':
		cookTime = int(data.get('cookTime', ''))
		if cookTime <= 0:
			return 'Invalid cookTime', 400
	cookbook[entries_name] = data
	return 'implemented successfully', 200


# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name   
@app.route('/summary', methods=['GET'])
def summary():
    recipe_name = request.args.get('name', '')
    if recipe_name not in cookbook or cookbook[recipe_name]["type"] != "recipe":
        return 'Invalid recipe', 400
    
    total_cooktime = 0
    ingredients = {}
    
    def process_requiredItems(item_name, quantity):
        nonlocal total_cooktime
        if item_name not in cookbook:
            return False
        item = cookbook[item_name]
        if item["type"] == "ingredient":
            total_cooktime += item["cookTime"] * quantity
            ingredients[item_name] = ingredients.get(item_name, 0) + quantity
        elif item["type"] == "recipe":
            for sub_item in item["requiredItems"]:
                if not process_requiredItems(sub_item["name"], sub_item["quantity"] * quantity):
                    return False
        return True
    
    for required_item in cookbook[recipe_name]["requiredItems"]:
        if not process_requiredItems(required_item["name"], required_item["quantity"]):
            return 'Invalid recipe', 400
    
    return jsonify({
        "name": recipe_name,
        "cookTime": total_cooktime,
        "ingredients": [{"name": name, "quantity": qty} for name, qty in ingredients.items()]
    })



# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
