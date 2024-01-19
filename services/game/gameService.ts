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
        return await fetch('http://192.168.1.21:8080/api/v1/game/newGame', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            player1: data.userId,
            player2: data.friendId,
            startTimestampFE: Date.now()
          }),
        })
    },
    unitMoved: async (data: UnitMove) => {

    }
}


export default gameServie