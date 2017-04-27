var sprites = {
  Beer: {sx: 512, sy: 99, w: 23, h: 32, frames: 1},
  Glass: {sx: 512, sy: 131, w: 23, h: 32, frames: 1},
  NPC: {sx: 512, sy: 66, w: 33, h: 33, frames: 1},
  ParedIzda: {sx: 0, sy: 0, w: 512, h: 480, frames: 1},
  Player: {sx: 512, sy: 0, w: 56, h: 66, frames: 1},
  TapperGameplay: {sx: 0, sy: 480, w: 512, h: 480, frames: 1}
};

var clients = {
  client: { x: 0, y: -50, sprite: 'NPC'}
};

var barras = [
  {x: 110, y: 89}, 
  {x: 78, y: 185},
  {x: 46, y: 281},
  {x: 14, y: 377}
];

var OBJECT_PLAYER = 1,
    OBJECT_CLIENT = 4,
    OBJECT_BEER = 2,
    OBJECT_GLASS = 8,
    OBJECT_DEADZONE = 16;
   
var startGame = function() {
   
  Game.setBoard(0,new TitleScreen("TAPPER", 
                                  "Press fire to start playing",
                                  playGame));
};


var levels = [
  //num barra, delay, espera respecto primero, num clientes, tipo cliente, vel max

  //level 1
  [[barras[0], 4.5, 0, 5, clients.client, {maxVel: 70}],
  [barras[1], 6, 3, 3, clients.client, {maxVel: 50}]],
  //level 2
  [[barras[0], 4.5, 0, 5, clients.client, {maxVel: 70}],
  [barras[1], 6, 3, 3, clients.client, {maxVel: 50}],
  [barras[2], 2, 1, 9, clients.client, {maxVel: 40}],
  [barras[3], 5, 4, 8, clients.client]]
];

var playGame = function() {
  var board = new GameBoard();
  var board2 = new GameBoard();
  board2.add(new GamePoints());
  board2.add(new Vidas());
  board2.add(new Niveles());
  
  board.add(new Fondo());
  
  Game.setBoard(0, board);
  
  Game.keys['fire'] = false;
  board2.add(new Player());

  for(i = 0; i < levels[GameManager.nivelActual-1].length; i++)    
    board2.add(new Spawner(levels[GameManager.nivelActual-1][i][0],
                           levels[GameManager.nivelActual-1][i][1],
                           levels[GameManager.nivelActual-1][i][2],
                           levels[GameManager.nivelActual-1][i][3],
                           levels[GameManager.nivelActual-1][i][4],
                           levels[GameManager.nivelActual-1][i][5]
                          ));
  
   
  board2.add(new DeadZone(85, 89, 30, 30, true));
  board2.add(new DeadZone(345, 89, 30, 30, false));
  board2.add(new DeadZone(53, 185, 30, 30, true));
  board2.add(new DeadZone(377, 185, 30, 30, false));
  board2.add(new DeadZone(21, 281, 30, 30, true));
  board2.add(new DeadZone(410, 281, 30, 30, false));
  board2.add(new DeadZone(-11, 377, 30, 30, true));
  board2.add(new DeadZone(442, 377, 30, 30, false));
 
  Game.setBoard(1,board2);
};


var winGame = function() {
  if(GameManager.nivelActual < levels.length){
    GameManager.aumentaNivel();
    GameManager.actualizaPuntosNivel();
    Game.setBoard(1,new TitleScreen("Nivel conseguido!", 
                                    "Press fire to play next level",
                                     playGame,
                                     true));
    GameManager.comprobarPuntos();
  }
  else{
    Game.setBoard(1,new TitleScreen("You win!", 
                                    "Press fire to play again",
                                     playGame,
                                     false));
    GameManager.comprobarPuntos();
    GameManager.initialize();
  }
  
};

var loseGame = function() {
  GameManager.diminuyeVida();
  if(GameManager.quedanVidas()){
    GameManager.reiniciarNivel();
    Game.setBoard(1,new TitleScreen("Upss!", 
                                  "Press fire to reset level",
                                  playGame,
                                  true));
  }
  else{
    Game.setBoard(1,new TitleScreen("You lose!", 
                                    "Press fire to play again",
                                    playGame,
                                    false));
    GameManager.comprobarPuntos();
    GameManager.initialize();
  }
  
};


var Fondo = function() { 
  this.setup('TapperGameplay');
  
  this.x = 0;
  this.y = 0;

  this.step = function(dt){};
};

Fondo.prototype = new Sprite();


var Player = function(){
  this.setup('Player', { reloadTime: 1 });
  this.reload = this.reloadTime;
  this.x = 325;
  this.y = 89;
  
  this.step = function(dt) {
    
    if(Game.keys['up']){
      this.x -= 32;
      this.y -= 96;
      if(this.y < 89){
        this.x = 421;
        this.y = 377;
      }
      Game.keys['up'] = false;
    }
    else if(Game.keys['down']){
      this.x += 32;
      this.y += 96;
      if(this.y > 421){
        this.x = 325;
        this.y = 89;
      }
      Game.keys['down'] = false;
    }

    this.reload-=dt;
    if(Game.keys['fire']) {
      Game.keys['fire'] = false;
      this.reload = this.reloadTime;

      this.board.add(Object.create(new Beer(this.x, this.y)));
    }
  };
};

Player.prototype = new Sprite();
Player.prototype.type = OBJECT_PLAYER;


var Beer = function(x, y) { 
  this.setup('Beer', { vx: 0, reloadTime: 0.25, maxVel: 20 });
  
  this.x = x - this.w;
  this.y = y; 
};

Beer.prototype = new Sprite();
Beer.prototype.type = OBJECT_BEER;

Beer.prototype.step = function(dt){
  this.vx = this.maxVel;
  this.x -= this.vx * dt;

  var collision1 = this.board.collide(this,OBJECT_CLIENT);
  var collision2 = this.board.collide(this,OBJECT_DEADZONE);

  if(collision1 || collision2) {
    this.board.remove(this);
    if(!collision1){
      GameManager.comprueba(this, collision2);
    }
    else{
      this.board.remove(collision1);
      this.board.add(new Glass(this.x, this.y));
      GameManager.aumentaPuntos(50);
      GameManager.comprueba(this, this);
    }
    
  }
  this.reload-=dt;
};


var Spawner = function(barra, delay, espera, numClientes, cliente, velocidad){
  GameManager.aumentaTotalClientes(numClientes);
  this.t = 0;
  this.num = numClientes;
  this.tiempo = espera;
  this.delay = delay;
  this.posicion = barra;
  this.velocidad = velocidad;
  this.cliente = cliente;
  this.restante = 0;
};

Spawner.prototype.step = function(dt){
  
  if(this.t >= this.tiempo && this.num > 0){
    if(this.restante <= 0){
      var override = Object.assign(this.posicion, this.velocidad);
      this.board.add(Object.create(new Client(this.cliente,override)));      
      this.num--;
      this.restante = this.delay;
    }
    else
      this.restante -= dt;
  }
  this.t += dt;
};

Spawner.prototype.draw = function(ctx) { };


var Client = function(blueprint,override) {
  this.merge(this.baseParameters);
  this.setup(blueprint.sprite,blueprint);
  this.merge(override);
  GameManager.aumentaClientes();
};

Client.prototype = new Sprite();
Client.prototype.type = OBJECT_CLIENT;

Client.prototype.step = function(dt){
  this.vx = this.maxVel;
  this.x += this.vx * dt;

  var collision1 = this.board.collide(this,OBJECT_DEADZONE);

  if(collision1) {
    GameManager.comprueba(this, collision1);       
  }

  this.reload-=dt;
};

Client.prototype.baseParameters = { maxVel: 20, reloadTime: 0.75, reload: 0 };


var Glass = function(x, y){
  
  this.setup('Glass', { vx: 0, reloadTime: 0.25, maxVel: 40 });
  this.x = x + this.w;
  this.y = y;

  GameManager.aumentaJarrasVacias();
};

Glass.prototype = new Sprite();
Glass.prototype.type = OBJECT_GLASS;

Glass.prototype.step = function(dt){
  this.vx = this.maxVel;
  this.x += this.vx * dt;

  var collision1 = this.board.collide(this,OBJECT_PLAYER);
  var collision2 = this.board.collide(this,OBJECT_DEADZONE);

  if(collision1 || collision2) {
    this.board.remove(this);
    if(collision1){
      GameManager.aumentaRecogidas();
      GameManager.disminuyeJarrasVacias();
      GameManager.aumentaPuntos(100);
      GameManager.comprueba(this, collision1);
    }
    else{
      GameManager.comprueba(this, collision2);

    }
  
  }

  this.reload-=dt;
};


var DeadZone = function(x, y, w, h, puerta){
  this.w = w;
  this.h = h;
  this.x = x;
  this.y = y;
  this.puerta = puerta;
  this.draw = function(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    
  };

  this.step = function(dt){};
};

DeadZone.prototype.type = OBJECT_DEADZONE;


var GameManager = new function(){
  
  this.initialize = function(){
    this.totalClientes = 0;
    this.clientes = 0;
    this.jarrasVacias = 0;
    this.recogidas = 0;
    this.points = 0;
    this.nivelActual = 1;
    this.vidas = 2;
    this.puntosInicioNivel = 0;
  };

  this.aumentaTotalClientes = function(num){
    this.totalClientes += num;
  };

  this.aumentaClientes = function(){this.clientes++;};
  this.disminuyeClientes = function(){this.clientes--;};

  this.aumentaJarrasVacias = function(){this.jarrasVacias++;};
  this.disminuyeJarrasVacias = function(){this.jarrasVacias--};

  this.aumentaRecogidas = function(){this.recogidas++;};
  this.disminuyeRecogidas = function(){this.recogidas--;};

  this.aumentaPuntos = function(puntos){this.points += puntos;};

  this.aumentaNivel = function(){this.nivelActual++};
  this.reiniciarNivel = function(){
    this.totalClientes = 0;
    this.clientes = 0;
    this.jarrasVacias = 0;
    this.recogidas = 0;
    this.points = this.puntosInicioNivel;
  };

  this.actualizaPuntosNivel = function(){this.puntosInicioNivel = this.points;};

  this.diminuyeVida = function(){this.vidas--;};
  this.quedanVidas = function(){return this.vidas > 0;};

  this.comprueba = function(objeto1, objeto2){
    if((this.clientes === this.totalClientes) && (this.jarrasVacias === 0) && (this.recogidas === this.totalClientes))
      winGame();
    else if((objeto1.sprite === "NPC" && !objeto2.puerta) || (objeto1.sprite === "Beer" && objeto2.puerta) || (objeto1.sprite === "Glass" && objeto2.sprite !== "Player" && !objeto2.puerta))
      loseGame();
  };

  this.comprobarPuntos = function(){
    Game.puntosMax = Math.max(this.points,Game.puntosMax);
  }
};

var Vidas = function() {
  
  this.draw = function(ctx) {
    ctx.save();
    ctx.font = "bold 18px arial";
    ctx.fillStyle= "#FFFFFF";

    var txt = "Vidas: " + GameManager.vidas;
    

    ctx.fillText(txt,Game.width - 80,20);
    ctx.restore();

  };

  this.step = function(dt) { };
};

var Niveles = function() {
  
  this.draw = function(ctx) {
    ctx.save();
    ctx.font = "bold 18px arial";
    ctx.fillStyle= "#FFFFFF";

    var txt = "Nivel: " + GameManager.nivelActual;
    

    ctx.fillText(txt,Game.width - 75,40);
    ctx.restore();

  };

  this.step = function(dt) { };
};


window.addEventListener("load", function() {
  Game.initialize("game",sprites,startGame);
  GameManager.initialize();
});
