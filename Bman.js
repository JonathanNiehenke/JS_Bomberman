let db = console.log;
let dbo = console.table;

function BombObj(Type, Index) {
    this.type = Type;
    this.index = Index;
    this.movement = undefined;
    this.annimate = undefined;
}

function TileBomber() {
    this.__proto__ = new Engine(undefined, " ", " ");
    // Create player constructor.
    this.player1 = {
        "type": "1",
        "index": undefined,
        "facing": "b",
        "toDirection": {"-1,0": "a", "1,0": "b", "0,-1": "c", "0,1": "d"},
        "bomb": "*",
        "score": 0,
        "scoreEL": document.getElementById("p1Score"),
    };
    this.player2 = {
        "type": "2",
        "index": undefined,
        "facing": "A",
        "toDirection": {"-1,0": "A", "1,0": "B", "0,-1": "C", "0,1": "D"},
        "bomb": "+",
        "score": 0,
        "scoreEL": document.getElementById("p2Score"),
    };
    this.bombs = {};  // Must find another way.
    this.keyInput = {
        "38": {"player": this.player1, "Movement": new IndexObj(-1, 0)},
        "40": {"player": this.player1, "Movement": new IndexObj(1, 0)},
        "37": {"player": this.player1, "Movement": new IndexObj(0, -1)},
        "39": {"player": this.player1, "Movement": new IndexObj(0, 1)},
        // Prevent Ctrl combined hot keys.
        // "17": {"player": this.player1, "Movement": undefined},
        "16": {"player": this.player1, "Movement": undefined},
        "87": {"player": this.player2, "Movement": new IndexObj(-1, 0)},
        "83": {"player": this.player2, "Movement": new IndexObj(1, 0)},
        "65": {"player": this.player2, "Movement": new IndexObj(0, -1)},
        "68": {"player": this.player2, "Movement": new IndexObj(0, 1)},
        "81": {"player": this.player2, "Movement": undefined},
        "69": {"player": this.player2, "Movement": undefined},
        "handle": function(keyEvent) {
            let Input = this.keyInput[keyEvent.keyCode];
            if (Input && Input.Movement) {
                let moveTo = Input.player.index.add(Input.Movement);
                let cellTo = this.Environment.cell[moveTo.toString()];
                let cellAction = this.Tile[cellTo].action;
                if (cellAction) {
                    cellAction.call(this, Input.player, moveTo, Input.Movement);
                }
            }
            else if (Input) {
                this.dropBomb(Input.player);
            }
        },
    };
    this.parseLevelFile = function*(levelFile) {
        let fileLines = levelFile.target.result.split("\n");
        Structure = [];
        for (let Line of fileLines) {
            if (!Line && Structure.length) {
                yield Structure;
                // Previous references are gone.
                Structure = [];
            }
            else if (Line && Line[0] !== "/") {
                Structure.push(Line);
            }
        }
    };
    this.handleFileEvent = function(fileEvent) {
        function onFileLoad(levelFile) {
            this.Levels = this.parseLevelFile(levelFile);
            this.Environment = this.nextEnvironment();
            let emptyLocations = this.Environment.cellLocations[" "];
            this.player1.index = emptyLocations[0];
            this.player2.index = emptyLocations[emptyLocations.length - 1];
            this.Environment.cell[this.player1.index] = this.player1.type;
            this.Environment.cell[this.player2.index] = this.player2.type;
            this.replaceImage(this.player1.index, this.player1.facing);
            this.replaceImage(this.player2.index, this.player2.facing);
        }
        let levelFile = fileEvent.target.files[0];
        if (levelFile) {
            let Reader = new FileReader();
            Reader.onload = onFileLoad.bind(this);
            Reader.readAsText(levelFile);  // Calls Reader.onload.
            document.getElementById("Game").className = "";
            document.getElementById("levels").className = "Hidden";
        }
    };
    this.dropBomb = function(player) {
        // Prevent multiple bomb drops on single cell.
        if (this.Environment.cell[player.index.toString()] === player.type) {
            this.Environment.cell[player.index.toString()] = player.bomb;
            let bomb = new BombObj(player.bomb, player.index);
            this.bombs[player.index.toString()] = bomb;
            setTimeout(this.explode.bind(this), 1500, bomb);
        }
    };
    this.blast = function(Index, range, Movement, imgVal) {
        if (!range) return;
        let toIndex = Index.add(Movement);
        let toCell = this.Environment.cell[toIndex.toString()];
        if (toCell === " ") {
            this.replaceImage(toIndex, imgVal);
            setTimeout(this.blast.bind(this), 20, toIndex,
                       range - 1, Movement, imgVal);
        }
        else if (toCell === "@" && imgVal === "&") {
            this.Environment.cell[toIndex] = " ";
            this.replaceImage(toIndex, imgVal);
        }
        else if (imgVal === "&" && (toCell === "1" || toCell === "2")) {
            let player = toCell === "1" ? this.player2 : this.player1;
            player.scoreEL.innerHTML = `Player ${player.type}: ${++player.score}`;
            this.replaceCell(toIndex, "!");
        }
    };
    this.setBlast = function(Time, Index, Range, imgVal) {
        let Directions = [new IndexObj(-1, 0), new IndexObj(1, 0),
                          new IndexObj(0, -1), new IndexObj(0, 1)];
        for (Movement of Directions) {
            setTimeout(
                this.blast.bind(this),Time, Index, Range, Movement, imgVal);
        }
    }
    this.explode = function(bomb) {
        clearTimeout(bomb.annimate);  // Stops a moving bomb.
        if (this.player1.index == bomb.index ||
            this.player2.index == bomb.index)
        {
            this.replaceCell(bomb.index, "!");
            let player = (this.player1.index == bomb.index
                          ? this.player2 : this.player1);
            let playerScoreMsg = `Player ${player.type}: ${++player.score}`
            player.scoreEL.innerHTML = playerScoreMsg;
        }
        else {
            this.replaceCell(bomb.index, " ")
            this.replaceImage(bomb.index, "&");
            setTimeout(this.replaceImage.bind(this), 180, bomb.index, " ");
        }
        this.setBlast(20, bomb.index, 2, "&");  // Actual blast;
        this.setBlast(200, bomb.index, 2, " ");  // Blast removal;
    };
    this.movePlayer = function(player, moveTo, Movement) {
        let Facing = player.toDirection[Movement.toString()];
        let onCell = (this.Environment.cell[player.index] === player.bomb
                      ? player.bomb : " ");
        this.replaceCell(player.index, onCell);
        this.Environment.cell[moveTo] = player.type;
        this.replaceImage(moveTo, Facing);
        player.index = moveTo;
        player.facing = Facing;
    };
    this.changeFacing = function(player, _, Movement) {
        let Facing = player.toDirection[Movement.toString()];
        this.replaceImage(player.index, Facing);
    };
    this.moveBomb = function(bomb) {
        let toIndex = bomb.index.add(bomb.movement);
        if (this.Environment.cell[toIndex.toString()] === " ") {
            this.replaceCell(bomb.index, " ");
            this.replaceCell(toIndex, bomb.type);
            bomb.index = toIndex;
            bomb.annimate = setTimeout(this.moveBomb.bind(this), 80, bomb);
        }
        else {
            bomb.annimate = undefined;
        }
    }
    this.pushBomb = function(player, moveTo, Movement) {
        // Two annimations for one bomb, an annimation does not expode.
        // Error when bomb is repushed.
        this.changeFacing(player, moveTo, Movement);
        let bomb = this.bombs[moveTo.toString()];
        try {
            console.log(bomb.index, " get: ", bomb.annimate);
        }
        catch (err) {
            console.log(bomb, moveTo.toString());
            console.log(err);
        }
        if (bomb.type === player.bomb && !bomb.annimate) {
            bomb.movement = Movement;
            this.moveBomb(bomb);
            console.log(bomb.index, "set: ", bomb.annimate);
        }
    };
    this.__constructTiles = function() {
        let getImg = document.getElementById.bind(document);
        let Tile = {
            " ": {"image": getImg("Empty"), "action": this.movePlayer},
            "#": {"image": getImg("Wall"), "action": this.changeFacing},
            "@": {"image": getImg("Brick"), "action": this.changeFacing},
            "1": {"image": getImg("p1Up"), "action": this.changeFacing},
            "2": {"image": getImg("p1Down"), "action": this.changeFacing},
            "&": {"image": getImg("Blast"), "action": undefined},
            "!": {"image": getImg("Death"), "action": undefined},
            "a": {"image": getImg("p1Up"), "action": undefined},
            "b": {"image": getImg("p1Down"), "action": undefined},
            "c": {"image": getImg("p1Left"), "action": undefined},
            "d": {"image": getImg("p1Right"), "action": undefined},
            "A": {"image": getImg("p2Up"), "action": undefined},
            "B": {"image": getImg("p2Down"), "action": undefined},
            "C": {"image": getImg("p2Left"), "action": undefined},
            "D": {"image": getImg("p2Right"), "action": undefined},
            "*": {"image": getImg("Bomb"), "action": this.pushBomb},
            "+": {"image": getImg("Bomb"), "action": this.pushBomb},
        };
        return Tile;
    };
    this.Tile = this.__constructTiles();
}

function init() {
    let Bomberman = new TileBomber();
    let handleFileEvent = Bomberman.handleFileEvent.bind(Bomberman);
    document.getElementById("levels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = Bomberman.keyInput.handle.bind(Bomberman);
    document.addEventListener("keydown", handleKey);
}
