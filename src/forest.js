export const size = 100;

export function getColor(cell, u, v, n) {
  if (cell === 0) {
    return "gray";
  } else if (cell >= 1 && cell <= Number(u) - 1) {
    return "lime";
  } else if (cell >= Number(u) && cell <= Number(v) - 1) {
    return "green";
  } else if (cell >= Number(v) && cell <= Number(n)) {
    return "olive";
  }
}

export function resetForest(deps) {
  const { setEstAux, setEstados, setMAux } = deps;
  let gridT1 = new Array(size)
    .fill(0)
    .map(i => new Array(size).fill(0).map(i => 0));
  setEstAux(gridT1);
  let gridT2 = new Array(size)
    .fill(0)
    .map(i => new Array(size).fill(0).map(i => 1));
  setEstados(gridT2);
  let gridT3 = new Array(size)
    .fill(0)
    .map(i => new Array(size).fill(0).map(i => 0));
  setMAux(gridT3);
}

// Floresta inicial
export function initForest(deps) {
  let {
    n,
    density,
    estados,
    maux,
    estaux,
    setEstados,
    setMAux,
    setEstAux
  } = deps;
  let hcg = 0,
    X,
    Y;
  n = Number(n);

  //Iniciar as matrixes e pintar tudo de verde claro
  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      estados[Y][X] = 0;
      maux[Y][X] = 0;
      estaux[Y][X] = 0;
    }
  }

  setMAux(maux);
  setEstAux(estaux);

  //Preencher, aleatoriamente, o "terreno"
  //Atribuir aos parâmetros u2, v e n os valores indicados, na interface, pelo utilizador
  if (density === true) {
    hcg = 1;
  } else {
    hcg = 2;
  }

  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      // Gerar um número aleatório (d), compreendido entre 0 e 1
      let k,
        d = Math.random();

      if (hcg === 1) {
        k = Math.round(d * (n - 2)) + 1; //(para obter uma densidade de 100%)
      }

      if (hcg === 2) {
        k = Math.round(d * n); //(para obter uma densidade menor que 100%)
      }

      estados[Y][X] = k;
    }
  }

  setEstados(Object.assign([], estados));
}

//EVOLUÇÃO DA FLORESTA
export function evolve(deps, onIteration, onEnd) {
  let c,
    est,
    contaverdes = 0,
    X,
    Y;
  let {
    estados,
    u,
    v,
    maux,
    n,
    estaux,
    anos,
    anosLapsed,
    setDensityLapsed,
    setMAux,
    setEstados,
    setEstAux
  } = deps;

  //Calcular o número de árvores adultas na vizinhança (4 vizinhos), para cada elemento da matrix
  for (X = 1; X < size - 1; X++) {
    for (Y = 1; Y < size - 1; Y++) {
      c = 0;
      if (estados[Y - 1][X] >= u && estados[Y - 1][X] <= v - 1) c = c + 1;
      if (estados[Y + 1][X] >= u && estados[Y + 1][X] <= v - 1) c = c + 1;
      if (estados[Y][X - 1] >= u && estados[Y][X - 1] <= v - 1) c = c + 1;
      if (estados[Y][X + 1] >= u && estados[Y][X + 1] <= v - 1) c = c + 1;
      maux[Y][X] = c;
    }
  }

  //mz:matrix de estados provisórios
  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      if (estados[Y][X] === n - 1) {
        estaux[Y][X] = 0;
      } else if (estados[Y][X] === 0 && maux[Y][X] >= 1) {
        estaux[Y][X] = 1;
      } else if (estados[Y][X] <= n - 2 && estados[Y][X] >= 1) {
        est = estados[Y][X];
        estaux[Y][X] = est + 1;
      } else {
        estaux[Y][X] = estados[Y][X];
      }
    }
  }

  //matrix: matrix de estados no fim de cada iteração
  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      estados[Y][X] = estaux[Y][X];
    }
  }

  //Contar o número de sítios verdes (sítios ocupados por vegetação)
  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      if (estados[Y][X] > 0) contaverdes = contaverdes + 1;
    }
  }

  //Calcular a densidade florestal
  setDensityLapsed(contaverdes / (size * size)); //Text2.Text = contaverdes / 100;
  setMAux(maux);
  setEstados(Object.assign([], estados));
  setEstAux(estaux);

  //Parar a evolução da floresta quando atingir o limite de anos indicado pelo utilizador
  if (anosLapsed === Number(anos)) onEnd();

  onIteration();
}

// Forest from canvas image
export function forestFromCanvasImage(deps, ctx) {
  let {
    estados,
    maux,
    estaux,
    setEstados,
    setMAux,
    setEstAux,
    colorMap
  } = deps;
  let X, Y;

  //Iniciar as matrixes e pintar tudo de verde claro
  
  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      estados[Y][X] = 0;
      maux[Y][X] = 0;
      estaux[Y][X] = 0;
    }
  }

  setMAux(maux);
  setEstAux(estaux);

  let step = ctx.canvas.width / size;
  for (X = 0; X < ctx.canvas.width; X+=step) {
    for (Y = 0; Y < ctx.canvas.height; Y+=step) {
      let data = ctx.getImageData(X, Y, 1, 1).data;

      // Map image pixel rgba color to forest cells
      let k = colorMap[data.join(',')] || 0;

      estados[Math.floor(Y/step)][Math.floor(X/step)] = k;
    }
  }

  setEstados(Object.assign([], estados));
}

export function getFireColor(cell) {
  if (cell === 1) {
    return "red";
  } else if (cell === 2) {
    return "black";
  } else if (cell === 0) {
    return "rgba(0,0,0,0.05)";
  } else {
    return "transparent";
  }
}

// Inicializar matrix de propagação do fogo
export function resetFire(deps) {
  const { u, v, n, estados, setMatrix, setMZ, setAux } = deps;
  let gridT4 = new Array(size)
    .fill(0)
    .map(i => new Array(size).fill(0).map(i => 0));
  let gridT5 = new Array(size)
    .fill(0)
    .map(i => new Array(size).fill(0).map(i => 0));
  setMZ(gridT5);
  let gridT6 = new Array(size)
    .fill(0)
    .map(i => new Array(size).fill(0).map(i => 0));
  setAux(gridT6);

  // Copiar os valores da matriz de estados na evolução da floresta para a matriz de estados da propagação do fogo
	for (let X = 1; X < size; X++) {
		for (let Y = 1; Y < size; Y++) {
			if (estados[Y][X] === 0) gridT4[Y][X] = -2;
			if (estados[Y][X] >= 1 && estados[Y][X] <= u - 1) gridT4[Y][X] = 0;
			if (estados[Y][X] >= u && estados[Y][X] <= v - 1) gridT4[Y][X] = 4;
      if (estados[Y][X] >= v && estados[Y][X] <= n) gridT4[Y][X] = 5;
      //if (Number(x) === X && Number(y) === Y) gridT4[Y][X] = 1;
    }
  }
  setMatrix(gridT4);
}

function mod(n, m) {
  let remain = n % m;
  return Math.floor(remain >= 0 ? remain : remain + m);
}

function calcWindFire(windprob, windfire) {
  for (let wfxi = 0; wfxi < windfire.length; wfxi++) {
    for (let wfyi = 0; wfyi < windfire[wfxi].length; wfyi++) {
      windfire[wfxi][wfyi] = Math.random() < windprob[wfxi][wfyi] ? 1 : 0;
    }
  }
}

// Calculate windfire matrix
function calcWindFireMatrix(wind) {

  // Get wind cells
  let winddir = mod(180 - Number(wind), 360);
  let max = 1;
  let midhigh = 0.5;
  let midlow = 0.2;
  let min = 0.01;
  let windprob = [
    [max, max, max], // nw, n, ne
    [max, max, max], // w,  0, e
    [max, max, max]  // sw, s, se
  ];
  let windfire = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

  // North
  if (winddir <= 22.5 || winddir > 337.5) {
    windprob = [[midhigh, max, midhigh], [midlow, max, midlow], [min, min, min]];
    calcWindFire(windprob, windfire);
  }

  // Northwest
  else if (winddir <= 66.5 && winddir > 22.5) { 
    windprob = [[max, midhigh, midlow], [midhigh, max, min], [midlow, min, min]];
    calcWindFire(windprob, windfire);
  }

  // West
  else if (winddir <= 111.5 && winddir > 66.5) { 
    windprob = [[midhigh, midlow, min], [max, max, min], [midhigh, midlow, min]];
    calcWindFire(windprob, windfire);
  }

  // Southwest
  else if (winddir <= 156.5 && winddir > 111.5) { 
    windprob = [[min, min, min], [midhigh, max, min], [max, midhigh, midlow]];
    calcWindFire(windprob, windfire);
  }

  // South
  else if (winddir <= 201.5 && winddir > 156.5) {
    windprob = [[min, min, min], [midlow, max, midlow], [midhigh, max, midhigh]];
    calcWindFire(windprob, windfire);
  }

  // Southest
  else if (winddir <= 246.5 && winddir > 201.5) {
    windprob = [[min, min, min], [min, max, midlow], [midlow, midhigh, max]];
    calcWindFire(windprob, windfire);
  }

  // East
  else if (winddir <= 291.5 && winddir > 246.5) {
    windprob = [[min, midlow, midhigh], [min, max, max], [min, midlow, midhigh]];
    calcWindFire(windprob, windfire);
  }

  // Northest
  else {
    windprob = [[min, midhigh, max], [min, max, midhigh], [min, min, midlow]];
    calcWindFire(windprob, windfire);
  }
  return windfire;
}

//PROPAGAÇÃO DO FOGO
export function fire(deps, onStats, onEnd) {
  let c = 0,
    X,
    Y;
  //let yy = 0;
  let cont0 = 0,
    cont1 = 0,
    cont2 = 0,
    cont3 = 0;
  let { p, q, matrix, aux, mz, setMatrix, wind } = deps;
  let windfire = calcWindFireMatrix(wind);
  console.log(windfire);

  //Calcular o número de vizinhos a arder (estado 1) para cada elemento da matrix
  for (X = 1; X < size - 1; X++) {
    for (Y = 1; Y < size - 1; Y++) {
      c = 0;
      //vizinhança 4 vizinhos (desactivada)
      /*
        If (matrix(y - 1, x) = 1) c = c + 1
        If (matrix(y + 1, x) = 1) c = c + 1
        If (matrix(y, x - 1) = 1) c = c + 1
        If (matrix(y, x + 1) = 1) c = c + 1
      */

      // vizinhança 8 vizinhos
      /*
      for (yy = Y - 1; yy < Y + 1; yy++) {
        if (matrix[yy][X - 1] === 1) c = c + 1;
        if (matrix[yy][X + 1] === 1) c = c + 1;
      }
      if (matrix[Y - 1][X] === 1) c = c + 1;
      if (matrix[Y + 1][X] === 1) c = c + 1;
      */

      // Vizinhança de 8 vizinhos + direção do vento
      if (matrix[Y - 1][X - 1] === 1 && windfire[2][2]) c = c + 1;
      if (matrix[Y - 1][X] === 1 && windfire[2][1]) c = c + 1;
      if (matrix[Y - 1][X + 1] === 1 && windfire[2][0]) c = c + 1;
      if (matrix[Y][X - 1] === 1 && windfire[1][2]) c = c + 1;
      //if (matrix[Y][X] === 1) c = c + 1; // Own cell
      if (matrix[Y][X + 1] === 1 && windfire[1][0]) c = c + 1;
      if (matrix[Y + 1][X - 1] === 1 && windfire[0][2]) c = c + 1;
      if (matrix[Y + 1][X] === 1 && windfire[0][1]) c = c + 1;
      if (matrix[Y + 1][X + 1] === 1 && windfire[0][0]) c = c + 1;
      aux[Y][X] = c;
    }
  }

  //mz: matrix de estados provisórios (regra de transição determinista)
  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      mz[Y][X] = matrix[Y][X];
      if (mz[Y][X] === 2) {
        mz[Y][X] = 3;
      } else if ((mz[Y][X] === 0 || mz[Y][X] === 4 || mz[Y][X] === 5) && aux[Y][X] >= 1) {
        mz[Y][X] = 1;
      } else if (mz[Y][X] === 1) {
        mz[Y][X] = 2;
      }
    }
  }

  //matrix: matrix de estados no fim de cada iteração (regra de transição estocástica)
  for (X = 0; X < size; X++) {
    for (Y = 0; Y < size; Y++) {
      //Randomize
      //Gerar um número aleatório (a), compreendido entre 0 e 1
      let a = Math.random();
      //Randomize
      //Gerar um número aleatório (b), compreendido entre 0 e 1
      let b = Math.random();
      //Regra de transição entre estados
      if (mz[Y][X] === 1 && (1 - p) * aux[Y][X] < a) {
        matrix[Y][X] = 1; // Started to burn
      } else if (mz[Y][X] === 2 && b < q) {
        matrix[Y][X] = 2; // Ended to burn
      }
    }
  }

  //Contagem do número de elementos de cada estado em cada iteração
  for (X = 1; X < size; X++) {
    for (Y = 1; Y < size; Y++) {
      if (matrix[Y][X] === 0 || matrix[Y][X] === 4 || matrix[Y][X] === 5) {
        cont0 = cont0 + 1; //(conta verdes)
      } else if (matrix[Y][X] === 1) {
        cont1 = cont1 + 1; //(conta a arder)
      } else if (matrix[Y][X] === 2) {
        cont2 = cont2 + 1; //(conta queimados)
      } else if (matrix[Y][X] === -2) {
        cont3 = cont3 + 1; //(conta sem vegetação)
      }
    }
  }

  onStats({
    green: cont0,
    burning: cont1,
    burned: cont2,
    soil: cont3
  });

  // Aplicar alterações
  setMatrix(Object.assign([], matrix));

  //Parar a propagação do fogo quando deixar de haver células a arder
  if (cont1 === 0) onEnd();
}
