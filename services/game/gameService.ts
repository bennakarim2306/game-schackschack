import Logger from "../../config/Logger";

interface UnitMove {
    moveTime: number,
    from: Position,
    to: Position,
    player: String
}

interface Position {
    raw: Raw,
    column: Column
}

enum Column {
    A, B, C, D, E, F, G, H, I
}

enum Raw {
    ONE = '1',
    TWO = '2',
    THREE = '3',
    FOUR = '4',
    FIVE = '5',
    SIX = '6',
    SEVEN = '7',
    EIGHT ='8'
} 

const gameServie = {
    startGameOnServer: async (data) => {
        const url = 'http://192.168.1.21:8080/api/v1/game/newGame';
        const gameData = {
            player1: data.userId,
            player2: data.friendId,
            startTimestampFE: Date.now()
        };
        
        Logger.info('GAME', `Starting new game: ${data.userId} vs ${data.friendId}`);
        Logger.request(url, 'POST', gameData);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gameData),
        });
        
        Logger.response(url, response.status);
        
        if (response.ok) {
            Logger.success('GAME', 'Game started successfully');
        } else {
            Logger.error('GAME', 'Failed to start game');
        }
        
        return response;
    },
    unitMoved: async (data: UnitMove) => {

    }
}


export default gameServie