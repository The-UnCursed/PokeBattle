$("#pokemon-input")
	.autocomplete({
		source: function (request, response) {
			$.get(
				`https://pokeapi.co/api/v2/pokemon?limit=1000`,
				function (data) {
					let results = data.results.filter((pokemon) =>
						pokemon.name
							.toLowerCase()
							.startsWith(request.term.toLowerCase())
					);
					response(results);
				}
			);
		},
		minLength: 2, // Minimum length before suggestions appear
		focus: function (event, ui) {
			$("#pokemon-input").val(ui.item.name); // Set the input to the selected Pokemon's name
			return false;
		},
		select: function (event, ui) {
			$("#pokemon-input").val(ui.item.name); // Set the input to the selected Pokemon's name
			return false;
		},
	})
	.autocomplete("instance")._renderItem = function (ul, item) {
	// Render each item in the dropdown with an image and name
	return $("<li class='pokemon-auto-complete'>")
		.append(
			`<div>${
				item.name
			}<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonId(
				item.url
			)}.png" alt="${
				item.name
			}" style="width:50px; height:50px; margin-left:auto;"></div>`
		)
		.appendTo(ul);
};

// Helper function to extract Pokemon ID from URL
function getPokemonId(url) {
	let parts = url.split("/");
	return parts[parts.length - 2]; // Pokemon ID is the second-to-last part of the URL
}


let team = []; // Array to store the team of Pokemon
const MAX_TEAM_SIZE = 6; // Maximum number of Pokemon in the team

// Add Pokemon to team when button is clicked
$("#add-pokemon").click(() => {
	let pokemonName = $("#pokemon-input").val();
	if (pokemonName) {
		$.get(
			`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`,
			function (data) {
				addPokemonToTeam(data.id);
			}
		).fail(function () {
			alert("Pokemon not found!");
		});
	}
});

// Fetch Pokemon and add to team
function addPokemonToTeam(pokemonId) {
	if (team.length < MAX_TEAM_SIZE) {
		fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
			.then((response) => response.json())
			.then((data) => {
				team.push(data);
				renderTeam();
				updateBattleArea();
			});
	} else {
		alert("Your team is full! You can't add more than 6 Pokemon.");
	}
}

// Remove Pokemon from team
function removePokemonFromTeam(index) {
	team.splice(index, 1);
	renderTeam();
}

// Render the team of Pokemon
function renderTeam() {
	$("#team").empty(); // Clear the team div

	for (let i = 0; i < MAX_TEAM_SIZE; i++) {
		if (i < team.length) {
			let pokemon = team[i];
			$("#team").append(`
                <div id="slot-${i + 1}" class="slot-pokemon">
                    <i class="fa-solid fa-x remove-pokemon" onclick="removePokemonFromTeam(${i})"></i>
                    <img class="slot-pokemon-background" src="images/pokeball-bg.png" alt="Pokeball background">
                    <img class="slot-pokemon-image" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
						pokemon.id
					}.png" alt="${pokemon.name}">
                </div>
            `);
		} else {
			$("#team").append(`
                <div id="slot-${i + 1}" class="slot-empty">
                    ${i + 1}
                </div>
            `);
		}
	}
}
renderTeam(); // Render the team when the page loads

// Get trainers from JSON file and display them
$.getJSON("trainers.json", function (data) {
	// Loop through each trainer
	Object.values(data.trainers).forEach((trainer) => {
		const trainerDiv = $("<div>").addClass("trainer");
		trainerDiv.append(`
            <div class="trainer-info">
                <h2>${trainer.name}</h2>
                <img src="images/trainers/${trainer.name.toLowerCase()}.png" alt="${
			trainer.name
		}" />
            </div>
        `);

		// Create a container for the Pokemon
		const pokemonContainer = $("<div>").addClass(
			"trainer-pokemon-container"
		);

		// Loop through each Pokemon of the trainer
		trainer.pokemon.forEach((poke) => {
			// Fetch Pokemon data from PokeAPI
			$.getJSON(
				`https://pokeapi.co/api/v2/pokemon/${poke.name.toLowerCase()}`,
				function (pokemonData) {
					// Get the types of the Pokemon
					const types = pokemonData.types.map(
						(type) => type.type.name
					);
					const typeImages = types
						.map(
							(type) =>
								`<img src="images/types/${type}.png" alt="${type}" />`
						)
						.join("");

					// Create a Pokemon card with image and name
					const pokemonCard = $(`
                        <div class="trainer-pokemon">
                            <img src="${pokemonData.sprites.front_default}" alt="${poke.name}" />
                            <p>${poke.name} - Lv.${poke.level}</p>
                            <div class="trainer-pokemon-types">
                                ${typeImages}
                            </div>
                        </div>
                    `);

					pokemonContainer.append(pokemonCard);
				}
			).fail(function () {
				console.error(`Error fetching data for ${poke.name}`);
			});
		});

		// Append Pokemon container to trainer
		trainerDiv.append(pokemonContainer);
		$("#trainers").append(trainerDiv);
	});
}).fail(function () {
	console.error("Error loading trainers.json");
});

let trainerTeam = []; // Array to store the team of the selected trainer

// Select Opponent (Event Delegation) - for dynamically created elements
$(document).on("click", ".trainer", function () {
	// Get the name of the trainer
	let trainerName = $(this).find("h2").text();

    // Clear the team array
    trainerTeam = [];

	// Get the Pokemon of the selected trainer
    $.getJSON("trainers.json", function (data) {
        const selectedTrainer = Object.values(data.trainers).find((trainer) => trainer.name === trainerName);
        if (selectedTrainer) {
            selectedTrainer.pokemon.forEach((poke) => {
                $.getJSON(`https://pokeapi.co/api/v2/pokemon/${poke.name.toLowerCase()}`, function (pokemonData) {
                    trainerTeam.push(pokemonData);
                    $("#opponent-trainer").attr("src", `images/trainers/${selectedTrainer.name.toLowerCase()}.png`);
                    renderOpponentTeam(trainerTeam);
                }).fail(function () {
                    console.error(`Error fetching data for ${poke.name}`);
                });
            });
        }
    }).fail(function () {
        console.error("Error loading trainers.json");
    });

    console.log(trainerTeam);
});

// Render Opponent's Team
function renderOpponentTeam() {
    $("#opponent-team").empty(); // Clear the team div

	for (let i = 0; i < MAX_TEAM_SIZE; i++) {
		if (i < trainerTeam.length) {
			let pokemon = trainerTeam[i];
			$("#opponent-team").append(`
                <div id="slot-${i + 1}" class="slot-pokemon">
                    <img class="slot-pokemon-background" src="images/pokeball-bg.png" alt="Pokeball background">
                    <img class="slot-pokemon-image" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${
						pokemon.id
					}.png" alt="${pokemon.name}">
                </div>
            `);
		} else {
			$("#opponent-team").append(`
                <div id="slot-${i + 1}" class="slot-empty">
                    ${i + 1}
                </div>
            `);
		}
	}
}
renderOpponentTeam(); // Render the opponent team when the page loads


// Battle Pokemon
$("#battle-btn").click(() => {
    if (team.length === 0) {
        alert("You need to have at least one Pokemon in your team to battle!");
        return;
    }

    if (trainerTeam.length === 0) {
        alert("Please select an opponent to battle!");
        return;
    }

    // Hide the team selection screen
    $("#setup-screen").slideUp();

    // Get the first Pokemon from the team
    const playerPokemon = team[0];
    const opponentPokemon = trainerTeam[0];

    // Display the Pokemon in the battle area
    $("#player-active-pokemon").html(`
        <img src="${playerPokemon.sprites.front_default}" alt="${playerPokemon.name}" />
        <div class="pokemon-info">
            <p id="player-active-pokemon-name">${playerPokemon.name.toUpperCase()}</p>
            <p id="player-active-pokemon-health">HP: ${playerPokemon.stats[0].base_stat}</p>
        </div>
    `);

    $("#opponent-active-pokemon").html(`
        <img src="${opponentPokemon.sprites.front_default}" alt="${opponentPokemon.name}" />
        <div class="pokemon-info">
            <p id="opponent-active-pokemon-name">${opponentPokemon.name.toUpperCase()}</p>
            <p id="opponent-active-pokemon-health">HP: ${opponentPokemon.stats[0].base_stat}</p>
        </div>
    `);
});

// Leave Battle (Go back to team selection)
$("#leave-battle-btn").click(() => {
    $("#setup-screen").slideDown();
});

// Attack Opponent
$("#attack-btn").click(() => {
    const playerPokemon = team[0];
    const opponentPokemon = trainerTeam[0];
	
    // Calculate damage
    const playerDamage = calculateDamage(playerPokemon, opponentPokemon);
    const opponentDamage = calculateDamage(opponentPokemon, playerPokemon);

    // Update health
    playerPokemon.stats[0].base_stat -= opponentDamage;
    opponentPokemon.stats[0].base_stat -= playerDamage;

    // Update health display
    $("#player-active-pokemon-health").text(`HP: ${playerPokemon.stats[0].base_stat}`);
    $("#opponent-active-pokemon-health").text(`HP: ${opponentPokemon.stats[0].base_stat}`);

    // Check if any Pokemon has fainted
    if (playerPokemon.stats[0].base_stat <= 0) {
        alert("Your Pokemon has fainted! Please select another Pokemon to continue the battle.");
        team.shift(); // Remove the fainted Pokemon from the team
        renderTeam();
        updateBattleArea(); // Update the battle area after removing the fainted Pokemon
    }

    if (opponentPokemon.stats[0].base_stat <= 0) {
        alert("Opponent's Pokemon has fainted! You win!");
        trainerTeam.shift(); // Remove the fainted Pokemon from the opponent's team
        renderOpponentTeam();
        updateBattleArea(); // Update the battle area after removing the fainted Pokemon
    }

    // Check if the battle is over
    if (team.length === 0 || trainerTeam.length === 0) {
        alert("The battle is over! Please select another opponent to continue.");
        $("#setup-screen").slideDown();
        updateBattleArea(); // Update the battle area when the battle is over
    }
});

// Update the battle area with the new active Pokémon
function updateBattleArea() {
    if (team.length > 0) {
        const playerPokemon = team[0];
        $("#player-active-pokemon").html(`
            <img src="${playerPokemon.sprites.front_default}" alt="${playerPokemon.name}" />
            <div class="pokemon-info">
                <p id="player-active-pokemon-name">${playerPokemon.name.toUpperCase()}</p>
                <p id="player-active-pokemon-health">HP: ${playerPokemon.stats[0].base_stat}</p>
            </div>
        `);
    } else {
        $("#player-active-pokemon").empty();
    }

    if (trainerTeam.length > 0) {
        const opponentPokemon = trainerTeam[0];
        $("#opponent-active-pokemon").html(`
            <img src="${opponentPokemon.sprites.front_default}" alt="${opponentPokemon.name}" />
            <div class="pokemon-info">
                <p id="opponent-active-pokemon-name">${opponentPokemon.name.toUpperCase()}</p>
                <p id="opponent-active-pokemon-health">HP: ${opponentPokemon.stats[0].base_stat}</p>
            </div>
        `);
    } else {
        $("#opponent-active-pokemon").empty();
    }
}

// Calculate damage
function calculateDamage(attacker, defender) {
    const attack = attacker.stats[1].base_stat;
    const defense = defender.stats[2].base_stat;
    const level = 50; // Assume level 50 for now
    const modifier = Math.random() * (1 - 0.85) + 0.85; // Random modifier between 0.85 and 1.0

    const damage = Math.floor(
        ((2 * level + 10) / 250) * (attack / defense) * 50 + 2 * modifier
    );

    return damage;
}
