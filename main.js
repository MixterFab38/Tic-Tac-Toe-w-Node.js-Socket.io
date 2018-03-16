
(function init() {
  const P1 = 'X';
  const P2 = 'O';
  let player;
  let game;

  const socket = io.connect('http://localhost:5000');

  class Player {
    constructor(name, type) {
      this.name = name;
      this.type = type;
      this.currentTurn = true;
      this.playsArr = 0;
    }

    // Chiffres permettant de gagner
    static get wins() {
      return [7, 56, 448, 73, 146, 292, 273, 84];
    }

    // Définit le coup joué par le joueur
    updatePlaysArr(tileValue) {
      this.playsArr += tileValue;
    }

    getPlaysArr() {
      return this.playsArr;
    }

    // Régle le tour pour que le joueur passe au suivant et met à jour l'interface utilisateur pour refléter la même chose.
    setCurrentTurn(turn) {
      this.currentTurn = turn;
      const message = turn ? 'Votre tour' : 'En attente du joueur adverse';
      $('#turn').text(message);
    }

    getPlayerName() {
      return this.name;
    }

    getPlayerType() {
      return this.type;
    }

    getCurrentTurn() {
      return this.currentTurn;
    }
  }

  class Game {
    constructor(roomId) {
      this.roomId = roomId;
      this.board = [];
      this.moves = 0;
    }

    // Créez le plateau de jeu en attachant des événements aux boutons
    createGameBoard() {
      function tileClickHandler() {
        const row = parseInt(this.id.split('_')[1][0], 10);
        const col = parseInt(this.id.split('_')[1][1], 10);
        if (!player.getCurrentTurn() || !game) {
          alert('Ce n\'est pas votre tour!');
          return;
        }

        if ($(this).prop('disabled')) {
          alert('la case a déja etait jouer');
          return;
        }

        // met a jour le plateau apres la fin du tour
        game.playTurn(this);
        game.updateBoard(player.getPlayerType(), row, col, this.id);

        player.setCurrentTurn(false);
        player.updatePlaysArr(1 << ((row * 3) + col));

        game.checkWinner();
      }

      for (let i = 0; i < 3; i++) {
        this.board.push(['', '', '']);
        for (let j = 0; j < 3; j++) {
          $(`#button_${i}${j}`).on('click', tileClickHandler);
        }
      }
    }
    // Retire le plateeau en debut de partie
    displayBoard(message) {
      $('.menu').css('display', 'none');
      $('.gameBoard').css('display', 'block');
      $('#userHello').html(message);
      this.createGameBoard();
    }
 
    updateBoard(type, row, col, tile) {
      $(`#${tile}`).text(type).prop('disabled', true);
      this.board[row][col] = type;
      this.moves++;
    }

    getRoomId() {
      return this.roomId;
    }

    // envoie les modification a l'adversaire
    playTurn(tile) {
      const clickedTile = $(tile).attr('id');

      // Emit un evenment pour indiquer que l'autre joueur a jouer.
      socket.emit('playTurn', {
        tile: clickedTile,
        room: this.getRoomId(),
      });
    }
    /**
     *
     * Pour déterminer une condition de victoire, chaque case est "marquée" de gauche
     * à droite et de haut en bas, avec des puissances successives de 2. Chaque cellule
     * représente donc un bit individuel dans une chaîne de 9 bits, et
     * Les cases du joueur à un moment donné peuvent être représentées comme
     * valeur unique de 9 bits. Un gagnant peut donc être facilement déterminé par
     * si les 9 bits actuels du joueur ont couvert une des combinaison".
     *
     *     273                 84
     *        \               /
     *          1 |   2 |   4  = 7
     *       -----+-----+-----
     *          8 |  16 |  32  = 56
     *       -----+-----+-----
     *         64 | 128 | 256  = 448
     *       =================
     *         73   146   292
     *
     */


      // verifie si le joueur est gagnant et annonce le vainqueur
      checkWinner() 
      {
        const currentPlayerPositions = player.getPlaysArr();

        Player.wins.forEach((winningPosition) => 
        {
          if ((winningPosition & currentPlayerPositions) === winningPosition) {
            game.announceWinner();
          }
        });
        
        const tieMessage = 'Égalité';
        if (this.checkTie()) 
        {
          socket.emit('gameEnded', 
          {
            room: this.getRoomId(),
            message: tieMessage,
          });
          alert(tieMessage);
          location.reload();
        }
    }

    checkTie() {
      return this.moves >= 9;
    }

    // Announce le vainqueur. 

    announceWinner() {
      const message = `${player.getPlayerName()} wins!`;
      socket.emit('gameEnded', {
        room: this.getRoomId(),
        message,
      });
      alert(message);
      location.reload();
      socket.emit('win', player.getPlayerName() + ' a gagner la partie');
    }

    // Arrete la partie si un autre joueur a gagner
    endGame(message) {
      alert(message);
      location.reload();
    }
  }

  // Créer une nouvelle partie
  $('#new').on('click', () => {
    const name = $('#nameNew').val();
    if (!name) {
      alert('Entrer votre nom !');
      return;
    }
    socket.emit('createGame', { name });
    player = new Player(name, P1);
    socket.emit('message-newGame', player.getPlayerName() + ' a crée une partie');
  });

  // Permet de rejoindre une partie créer et de mettre a jour les textes.
  $('#join').on('click', () => {
    const name = $('#nameJoin').val();
    const roomID = $('#room').val();
    if (!name || !roomID) {
      alert('Entrer l\'ID de la room');
      return;
    }
    socket.emit('joinGame', { name, room: roomID });
    player = new Player(name, P2);
    socket.emit('message-joinGame', player.getPlayerName() + ' a rejoin la partie');
  });


 // créer une partie pour le joueur 1
  socket.on('newGame', (data) => {
    const message =
      `'Bonjour, ${data.name}. 'ID de la room :' 
      ${data.room}. En attente du joueur 2...`;

   
    game = new Game(data.room);
    game.displayBoard(message);
  });


  /**
   * Si le joueur a creer une partie il sera le joueur avec les croix
   */
  socket.on('player1', (data) => {
    const message = `Bonjour, ${player.getPlayerName()}`;
    $('#userHello').html(message);
    player.setCurrentTurn(true);
    
  });

  /**
   * Si le joueur deux rejoind une partie , il sera les ronds
   */
  socket.on('player2', (data) => {
    const message = `Bonjour, ${data.name}`;

    // Create game for player 2
    game = new Game(data.room);
    game.displayBoard(message);
    player.setCurrentTurn(false);
    
  });

  /**
   * Met a jour l'interface apres un tour jouer et previent l'adversaire que c'est a sn tour
   */
  socket.on('turnPlayed', (data) => {
    const row = data.tile.split('_')[1][0];
    const col = data.tile.split('_')[1][1];
    const opponentType = player.getPlayerType() === P1 ? P2 : P1;

    game.updateBoard(opponentType, row, col, data.tile);
    player.setCurrentTurn(true);
  });

  // Si l'autre joueur gagne, cet événement est reçu. Notifier l'utilisateur que le jeu est terminé.
  socket.on('gameEnd', (data) => {
    game.endGame(data.message);
    socket.leave(data.room);
  });

  $('#button_00').on('click', () => {
    socket.emit('case1', ' la case 1 a été cocher par '+ player.getPlayerName());
  });

  $('#button_01').on('click', () => {
    socket.emit('case2', ' la case 2 a été cocher par '+ player.getPlayerName());
  });

  $('#button_02').on('click', () => {
    socket.emit('case3', ' la case 3 a été cocher par '+ player.getPlayerName());
  });

  $('#button_10').on('click', () => {
    socket.emit('case4', ' la case 4 a été cocher par '+ player.getPlayerName());
  });

  $('#button_11').on('click', () => {
    socket.emit('case5', ' la case 5 a été cocher par '+ player.getPlayerName());
  });

  $('#button_12').on('click', () => {
    socket.emit('case6', ' la case 6 a été cocher par '+ player.getPlayerName());
  });

  $('#button_20').on('click', () => {
    socket.emit('case7', ' la case 7 a été cocher par '+ player.getPlayerName());
  });

  $('#button_21').on('click', () => {
    socket.emit('case8', ' la case 8 a été cocher par '+ player.getPlayerName());
  });

  $('#button_22').on('click', () => {
    socket.emit('case9', ' la case 9 a été cocher par '+ player.getPlayerName());
  });
}());