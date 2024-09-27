document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000';
    
    // Função para Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log('Login Response:', data);

                if (response.ok) {
                    // Armazenando o token no localStorage
                    localStorage.setItem('token', data.token);
                    alert('Login bem-sucedido!');
                    window.location.href = 'dashboard.html';  // Redireciona para a página de dashboard
                } else {
                    alert('Erro no login: ' + data.message);
                }
            } catch (error) {
                console.error('Error during login:', error);
            }
        });
    }

    // Função para buscar todos os decks
    const loadDecksButton = document.getElementById('loadDecksButton');
    const deckList = document.getElementById('deck-list');
    
    if (loadDecksButton) {
        loadDecksButton.addEventListener('click', loadDecks);
    }

    async function loadDecks() {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                alert('Token não encontrado! Por favor, faça login.');
                return;
            }

            const response = await fetch(`${API_URL}/deck/myDecks`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar decks: ' + response.statusText);
            }

            const decks = await response.json();
            console.log('Decks recebidos:', decks);

            deckList.innerHTML = ''; // Limpa a lista antes de adicionar novos decks

            decks.forEach((deck) => {
                const li = document.createElement('li');
                const name = deck.name || 'Sem nome';
                const description = deck.description || 'Sem descrição';
                const commanderName = deck.commanderName || 'Sem comandante';
                const colors = deck.colors?.join(', ') || 'Sem cores';
                const cards = deck.cards || [];

                // Criar conteúdo principal do deck
                li.textContent = `${name} - Descrição: ${description} - Comandante: ${commanderName} - Cores: ${colors}`;

                // Adicionar um contêiner para as cartas
                const cardContainer = document.createElement('div');
                cardContainer.className = 'card-container'; // Classe para o contêiner de cartas
                li.appendChild(cardContainer); // Adiciona o contêiner ao item da lista

                // Adicionar as cartas
                cards.forEach(async (card) => {
                    const cardItem = document.createElement('div'); // Use div para cada carta
                    cardItem.className = 'card-item'; // Classe para cada carta

                    // Busca a imagem da carta usando a Scryfall API
                    try {
                        const cardResponse = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(card)}`);
                        if (!cardResponse.ok) {
                            throw new Error('Erro ao buscar a carta: ' + cardResponse.statusText);
                        }

                        const cardData = await cardResponse.json();
                        const cardImage = cardData.image_uris?.normal || 'https://via.placeholder.com/150'; // Imagem da carta ou placeholder

                        // Criar elemento de imagem para cada carta
                        const img = document.createElement('img');
                        img.src = cardImage; // URL da imagem
                        img.alt = card; // Nome da carta como texto alternativo
                        img.className = 'card-image'; // Adiciona uma classe para a imagem

                        // Adiciona o nome da carta
                        const cardName = document.createElement('p');
                        cardName.textContent = card; // Nome da carta

                        // Adiciona a imagem e o nome ao cardItem
                        cardItem.appendChild(img); // Adiciona a imagem
                        cardItem.appendChild(cardName); // Adiciona o nome
                    } catch (error) {
                        console.error('Erro ao buscar a imagem da carta:', error);
                        cardItem.textContent = card + ' - Imagem não encontrada'; // Caso a imagem não seja encontrada
                    }

                    cardContainer.appendChild(cardItem); // Adiciona a carta ao contêiner de cartas
                });

                // Criar o botão de exclusão
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Excluir';
                deleteButton.addEventListener('click', () => deleteDeck(deck._id)); // Função para excluir o deck
                li.appendChild(deleteButton); // Adiciona o botão de exclusão ao item da lista

                deckList.appendChild(li); // Adiciona o item da lista
            });

        } catch (error) {
            console.error('Error fetching decks:', error);
        }
    }

    // Função para deletar um deck
    async function deleteDeck(deckId) {
        const confirmDelete = confirm("Tem certeza que deseja excluir este deck?");
        
        if (!confirmDelete) return;
      
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/deck/deleteDeck/${deckId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error('Erro ao excluir o deck: ' + errorData.message);
            }

            alert('Deck excluído com sucesso!');
            loadDecks(); // Recarrega os decks após exclusão
        } catch (error) {
            console.error('Erro ao excluir o deck:', error);
            alert('Ocorreu um erro ao excluir o deck.');
        }
    }

    // Função para criar um novo deck
    const createDeckForm = document.getElementById('createDeckForm');
    if (createDeckForm) {
        createDeckForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const commanderName = document.getElementById('commanderName').value;
            const deckName = document.getElementById('deckName').value;

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Token não encontrado! Por favor, faça login.');
                    return;
                }

                const response = await fetch(`${API_URL}/deck/newDeckWithCommander?commanderName=${encodeURIComponent(commanderName)}&deckName=${encodeURIComponent(deckName)}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error('Erro ao criar o deck: ' + errorData.message);
                }

                const newDeck = await response.json();
                alert('Deck criado com sucesso!');
                console.log('Deck criado:', newDeck);

                // Atualiza a lista de decks após a criação
                loadDecks();

            } catch (error) {
                console.error('Erro ao criar o deck:', error);
                alert(error.message);
            }
        });
    }
});
