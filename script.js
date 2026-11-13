
let foodData = [];

const form = document.getElementById("dietForm");
const errorBox = document.getElementById("error");
const results = document.getElementById("results");
const submitBtn = document.getElementById("submitBtn");

function numberValue(food, column) {
    const value = Number(food[column]);
    return Number.isFinite(value) ? value : 0;
}

function percentileRanks(values) {
    const sorted = [...values].sort((a, b) => a - b);

    return values.map(value => {
        let count = 0;
        for (const item of sorted) {
            if (item <= value) count++;
        }
        return count / sorted.length;
    });
}

function bmiCategory(bmi, age) {
    if (age < 18) {
        return "Adult BMI categories do not apply";
    }

    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obesity range";
}

function rankFoods(goal) {
    const energy = foodData.map(f => numberValue(f, "Energy kcal"));
    const protein = foodData.map(f => numberValue(f, "Protein(g)"));
    const carbs = foodData.map(f => numberValue(f, "Carbs"));
    const fat = foodData.map(f => numberValue(f, "Fat(g)"));
    const sugar = foodData.map(f => numberValue(f, "Freesugar(g)"));
    const fibre = foodData.map(f => numberValue(f, "Fibre(g)"));

    const E = percentileRanks(energy);
    const P = percentileRanks(protein);
    const C = percentileRanks(carbs);
    const F = percentileRanks(fat);
    const S = percentileRanks(sugar);
    const R = percentileRanks(fibre);

    return foodData.map((food, i) => {
        let score;

        if (goal === "Weight Loss") {
            score = 0.30 * P[i] + 0.30 * R[i]
                  - 0.25 * E[i] - 0.15 * S[i];
        } else if (goal === "Weight Gain") {
            score = 0.35 * E[i] + 0.35 * P[i]
                  + 0.20 * C[i] + 0.10 * R[i];
        } else if (goal === "Maintain Weight") {
            score = 0.30 * P[i] + 0.25 * R[i]
                  - 0.20 * S[i] - 0.15 * F[i] - 0.10 * E[i];
        } else {
            score = 0.35 * P[i] + 0.35 * R[i]
                  - 0.20 * S[i] - 0.10 * F[i];
        }

        return { ...food, recommendationScore: score };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 10);
}

function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

function showRecommendations(recommendations) {
    const table = document.getElementById("foodTable");
    table.replaceChildren();

    recommendations.forEach(food => {
        const row = document.createElement("tr");

        addCell(row, food["Food Items"]);
        addCell(row, numberValue(food, "Energy kcal").toFixed(2));
        addCell(row, numberValue(food, "Protein(g)").toFixed(2));
        addCell(row, numberValue(food, "Carbs").toFixed(2));
        addCell(row, numberValue(food, "Fat(g)").toFixed(2));
        addCell(row, numberValue(food, "Fibre(g)").toFixed(2));
        addCell(row, food["Food_Cluster"] ?? "Not assigned");

        table.appendChild(row);
    });

    document.getElementById("foodCount").textContent =
        `Showing ${recommendations.length} food recommendations`;
}

form.addEventListener("submit", function(event) {
    event.preventDefault();
    errorBox.textContent = "";

    const gender = document.getElementById("gender").value;
    const age = Number(document.getElementById("age").value);
    const height = Number(document.getElementById("height").value);
    const weight = Number(document.getElementById("weight").value);
    const goal = document.getElementById("goal").value;

    if (!gender || !goal || !Number.isFinite(age) ||
        !Number.isFinite(height) || !Number.isFinite(weight)) {
        errorBox.textContent = "Please complete all fields.";
        return;
    }

    if (age < 13 || age > 100 ||
        height < 100 || height > 230 ||
        weight < 25 || weight > 300) {
        errorBox.textContent = "Please enter valid age, height and weight values.";
        return;
    }

    if (foodData.length === 0) {
        errorBox.textContent = "Food dataset is not loaded. Please refresh the page.";
        return;
    }

    const bmi = weight / ((height / 100) ** 2);

    document.getElementById("resultGender").textContent = gender;
    document.getElementById("resultAge").textContent = `${age} years`;
    document.getElementById("resultBMI").textContent = bmi.toFixed(2);
    document.getElementById("resultCategory").textContent =
        bmiCategory(bmi, age);
    document.getElementById("resultGoal").textContent = goal;

    showRecommendations(rankFoods(goal));
    results.hidden = false;
    results.scrollIntoView({ behavior: "smooth" });
});

async function loadFoodData() {
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Loading food dataset...";

        const response = await fetch("./food_clustered.json");

        if (!response.ok) {
            throw new Error(`Dataset request failed: ${response.status}`);
        }

        const data = await response.json();

        foodData = data.filter(food =>
            food["Food Items"] &&
            ["Energy kcal", "Carbs", "Protein(g)", "Fat(g)",
             "Freesugar(g)", "Fibre(g)"].every(column =>
                Number.isFinite(Number(food[column])) &&
                Number(food[column]) >= 0
            )
        );

        if (foodData.length === 0) {
            throw new Error("No valid food records were found.");
        }

        submitBtn.disabled = false;
        submitBtn.textContent = "Get Food Recommendations";

        console.log("Food records loaded:", foodData.length);

    } catch (error) {
        errorBox.textContent =
            "Unable to load the food dataset. " + error.message;
        submitBtn.textContent = "Dataset loading failed";
    }
}

loadFoodData();
