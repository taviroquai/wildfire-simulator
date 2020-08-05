import React, { useState, useEffect, useRef } from "react";
import RgbQuant from 'rgbquant';
import {
  resetForest,
  initForest,
  forestFromCanvasImage,
  evolve,
  getColor,
  fire,
  getFireColor,
  resetFire,
  size
} from "./forest";
import "./styles.css";

let simT, evolveT, ctx;
const options = {
  key: 'AT2fkB2zXF0BHKiPZgx5OjtVn1J58jVJ', // REPLACE WITH YOUR KEY !!!
  lat: 37.15,
  lon: -7.66,
  zoom: 11,
};

export default function App() {
  let [view, setView] = useState("forest");
  let [evolving, setEvolving] = useState(false);
  let [burning, setBurning] = useState(false);
  let [estaux, setEstAux] = useState([]);
  let [estados, setEstados] = useState([]);
  let [maux, setMAux] = useState([]);
  let [matrix, setMatrix] = useState([]);
  let [mz, setMZ] = useState([]);
  let [aux, setAux] = useState([]);
  let [contador, setContador] = useState(0);
  let [u, setU] = useState(10);
  let [v, setV] = useState(12);
  let [n, setN] = useState(16);
  let [p, setP] = useState(0.95);
  let [q, setQ] = useState(0.2);
  let [x, setX] = useState(50);
  let [y, setY] = useState(50);
  let [anos, setAnos] = useState(1);
  let [anosLapsed, setAnosLapsed] = useState(1);
  let [densityLapsed, setDensityLapsed] = useState(1);
  let [density, setDensity] = useState(false);
  let [hasImage, setHasImage] = useState(false);
  let [maxColors, setMaxColors] = useState(8);
  let [boxSize, setBoxSize] = useState(16);
  let [boxPxls, setBoxPxls] = useState(2);
  let [colorDist, setColorDist] = useState('euclidean');
  let [palette, setPalette] = useState([]);
  let [colorMap, setColorMap] = useState({});
  let [selectedColor, setSelectedColor] = useState('');
  let [wind, setWind] = useState(0);
  let canvasRef = useRef();
  let canvasRef2 = useRef();

  // Timeout refs
  const evolveCounterRef = useRef(1);
  evolveCounterRef.current = anosLapsed;
  const fireCounterRef = useRef(0);
  fireCounterRef.current = contador;

  function getWindData() {
    window.windyInit(options, windyAPI => {
      const { picker, utils, broadcast } = windyAPI;
    
      picker.on('pickerOpened', latLon => {
          // picker has been opened at latLon coords
          console.log(latLon);
    
          const { lat, lon, values, overlay } = picker.getParams();
          // -> 48.4, 14.3, [ U,V, ], 'wind'
          console.log(lat, lon, values, overlay);
    
          const windObject = utils.wind2obj(values);
          console.log('wind', windObject);
          setWind(windObject.dir);
      });
    
      picker.on('pickerMoved', latLon => {
          // picker was dragged by user to latLon coords
          console.log(latLon);

          const { lat, lon, values, overlay } = picker.getParams();
          // -> 48.4, 14.3, [ U,V, ], 'wind'
          console.log(lat, lon, values, overlay);
    
          const windObject = utils.wind2obj(values);
          console.log('wind', windObject);
          setWind(windObject.dir);
      });
    
      picker.on('pickerClosed', () => {
          // picker was closed
      });
    
      // Wait since wather is rendered
      broadcast.once('redrawFinished', () => {
          picker.open({ lat: 37.15, lon: -7.66 });
          // Opening of a picker (async)
      });
    });
  }

  // On click reset forest
  function clickResetForest() {
    setView("forest");
    clickStopEvolving();
    resetForest({ setEstAux, setEstados, setMAux, setAnos });
    setAnos(1);
  }

  // On click reset fire
  function clickResetFire() {
    resetFire({ x, y, u, v, n, estados, setMatrix, setAux, setMZ });
    setContador(0);
  }

  function clickStopEvolving() {
    clearInterval(evolveT);
    setEvolving(false);
  }

  // On click start fire
  function clickFireStart() {
    simT = setInterval(() => {
      setBurning(true);
      fire(
        { p, q, matrix, aux, mz, setMatrix, wind },
        stats => {
          console.log("stats", contador, stats);

          //Contagem do número de iterações (tempo de duração do fogo)
          setContador(contador => contador + 1);

          //matrix do número de elementos de cada estado em cada iteração
          //contagem[contador][1] = cont0; //(2ª coluna: nº de verdes)
          //contagem[contador][2] = cont1; //(3ª coluna: nº de vermelhos)
          //contagem[contador][3] = cont2; //(4ª coluna: nº de pretos)

          // Burned area percentage
          // (stats.burning / (size*size - (stats.soil))) * size;
        },
        () => {
          clearInterval(simT);
          setBurning(false);
        }
      );
    }, 500);
  }

  function clickStopFire() {
    clearInterval(simT);
    setBurning(false);
  }

  function clickStartEvolving() {
    setView("forest");
    clickStopEvolving();
    resetForest({ setEstAux, setEstados, setMAux, setAnos });
    setEvolving(true);
    initForest({
      n,
      density,
      estados,
      maux,
      estaux,
      setEstados,
      setMAux,
      setEstAux
    });

    setAnosLapsed(1);
    evolveT = setInterval(() => {
      evolve(
        {
          estados,
          u,
          v,
          maux,
          n,
          estaux,
          anos,
          setDensityLapsed,
          setMAux,
          setEstados,
          setEstAux,
          anosLapsed: evolveCounterRef.current
        },
        () => {
          setAnosLapsed(anosLapsed => anosLapsed + 1);
        },
        () => {
          clearInterval(evolveT);
          setEvolving(false);
        }
      );
    }, 1000);
  }

  function rebuildForestFromImage() {
    // Reduce image colors
    var opts = {
      colors: Number(maxColors), // desired palette size
      boxSize: [boxSize,boxSize], // subregion dims (if method = 2)
      boxPxls: boxPxls, // min-population threshold (if method = 2)
      colorDist: colorDist // Or manhattan
    };
    
    var q = new RgbQuant(opts);
    q.sample(canvasRef.current, ctx.canvas.width);
    var pal = q.palette();
    setPalette(getReducedColors(pal));
    setColorMap({});
    let imgArray = q.reduce(canvasRef.current);
    let imgData = new Uint8ClampedArray(4 * ctx.canvas.width * ctx.canvas.height);
    for(var i = 0; i < imgArray.length; i += 4) {
      imgData[i] = imgArray[i];// red
      imgData[i + 1] = imgArray[i+1]; // green
      imgData[i + 2] = imgArray[i+2];// blue
      imgData[i + 3] = imgArray[i+3]; //alpha 
    }
    imgData = new ImageData(imgData, ctx.canvas.width, ctx.canvas.height);
    const ctx2 = canvasRef2.current.getContext("2d");
    ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
    ctx2.putImageData(imgData, 0, 0);

    mapForestColors();

    // Reset fire
    resetFire({ x, y, u, v, n, estados, setMatrix, setAux, setMZ });
    setContador(0);
  }

  function mapForestColors() {
    const ctx2 = canvasRef2.current.getContext("2d");
    // Use reduced image
    forestFromCanvasImage({
      n,
      density,
      estados,
      maux,
      estaux,
      setEstados,
      setMAux,
      setEstAux,
      colorMap
    }, ctx2);
  }

  function readImage(e) {
    if (!e.target.files || !e.target.files[0]) return;
    const FR = new FileReader();
    FR.addEventListener("load", (evt) => {
      const img = new Image();
      img.addEventListener("load", () => {
        ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
        setHasImage(true);
        rebuildForestFromImage();
      });
      img.src = evt.target.result;
    });
    FR.readAsDataURL(e.target.files[0]);
  }

  function setFireStartOnClick(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / 3);
    const y = Math.floor((e.clientY - rect.top) / 3);
    setX(x);
    setY(y);
    for (let X = 1; X < size; X++) {
      for (let Y = 1; Y < size; Y++) {
        if (Number(x) === X && Number(y) === Y) matrix[Y][X] = 1;
      }
    }
    setMatrix(matrix);
  }

  function onClickReducedImage(e) {
    const rect = canvasRef2.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left));
    const y = Math.floor((e.clientY - rect.top));
    let ctx2 = canvasRef2.current.getContext("2d");
    let data = ctx2.getImageData(x, y, 1, 1).data;
    setSelectedColor(data.join(','));
  }

  function getReducedColors(pal) {
    let colors = [];
    for (let i = 0; i < pal.length; i += 4) {
      colors.push([pal[i], pal[i+1], pal[i+2], pal[i+3]]);
    }
    return colors;
  }

  function onChangeColorMap(index, value) {
    colorMap[index] = Number(value);
    setColorMap(Object.assign({}, colorMap));
  }

  // Init forest
  useEffect(() => {
    clickResetForest();
    let gridT4 = new Array(size)
      .fill(0)
      .map(i => new Array(size).fill(0).map(i => 0));
      setMatrix(gridT4);
    getWindData();
  }, []);

  // Render UI
  return (
    <div className="App">
      <h1>Wildfire Simulator</h1>

        <table className="forest" style={{ minHeight: '300px', margin: '0 auto' }}>
          <tbody>
            <tr>
              <td>
                <div className="forest-map" style={{ position: 'relative' }}>
                  <div className="grid" style={{ position: 'absolute', top: '0px', left: '0px'}}>
                    {estados.map((i, ii) => (
                      <div className="row" key={String(ii)}>
                        {i.map((j, iii) => {
                          return (
                            <div
                              key={String(iii) + String(ii)}
                              className="cell"
                              style={{ backgroundColor: getColor(j, u, v, n) }}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </td>
              {view === "forest" ? (
                <td style={{ textAlign: "left" }}>
                  <h4>Forest</h4>
                  <label>a</label>
                  <input
                    value={u}
                    onChange={e => setU(e.target.value)}
                    disabled={evolving}
                  />
                  <em>0 &lt; a &lt; v</em>
                  <br />
                  <label>v</label>
                  <input
                    value={v}
                    onChange={e => setV(e.target.value)}
                    disabled={evolving}
                  />
                  <em>a &lt; v &lt; n</em>
                  <br />
                  <label>n</label>
                  <input
                    value={n}
                    onChange={e => setN(e.target.value)}
                    disabled={evolving}
                  />
                  <br />
                  {/*
                  <label>Density</label>
                  <input
                    name="density"
                    type="radio"
                    checked={density}
                    onChange={e => setDensity(true)}
                    disabled={evolving}
                  />
                  Yes
                  <input
                    name="density"
                    type="radio"
                    checked={!density}
                    onChange={e => setDensity(false)}
                    disabled={evolving}
                  />
                  No
                  <br />
                  
                  <label>Years</label>
                  <input value={anos} onChange={e => setAnos(e.target.value)} />
                  <div>
                    {evolving ? (
                      <button onClick={clickStopEvolving.bind(this)}>
                        Stop Evolving
                      </button>
                    ) : (
                      <button onClick={clickStartEvolving.bind(this)}>
                        Start Evolving
                      </button>
                    )}

                    <button
                      onClick={clickResetForest.bind(this)}
                      disabled={evolving}
                    >
                      Reset Forest
                    </button>
                  </div>
                  */}
                  <br />
                  <div>
                    Generate from image (300x300px)<br />
                    <input type='file' id="fileUpload" onChange={e => readImage(e)} /><br />
                    <label>Reduce to max. colors:</label>
                    <input value={maxColors} onChange={e => setMaxColors(e.target.value)} /><br />
                    <label>Reduce box size:</label>
                    <input value={boxSize} onChange={e => setBoxSize(e.target.value)} /><br />
                    <label>Reduce box pixels:</label>
                    <input value={boxPxls} onChange={e => setBoxPxls(e.target.value)} /><br />
                    <label>Color distance algorithmn:</label>
                    <select value={colorDist} onChange={e => setColorDist(e.target.value)}>
                      <option value="euclidean">euclidean</option>
                      <option value="manhattan">manhattan</option>
                    </select><br />
                    <button onClick={e => rebuildForestFromImage()}>
                      Apply Changes
                    </button>
                    <button
                      onClick={clickResetForest.bind(this)}
                      disabled={evolving}
                    >
                      Reset
                    </button>
                    {evolving ? (
                      <button onClick={clickStopEvolving.bind(this)}>
                        Stop Evolve
                      </button>
                    ) : (
                      <button onClick={clickStartEvolving.bind(this)}>
                        Evolve
                      </button>
                    )}
                    <button onClick={e => setView("fire")}>
                      Go to simulator
                    </button>
                  </div>
                </td>
              ) : (
                <td style={{ textAlign: "left" }}>
                  <h4>Simulator</h4>
                  <label>p</label>
                  <input
                    value={p}
                    onChange={e => setP(e.target.value)}
                    disabled={burning}
                  />
                  <em>0 &lt; p &lt; 1</em>
                  <br />
                  <label>q</label>
                  <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    disabled={burning}
                  />
                  <em>0 &lt; q &lt; 1</em>
                  <br />
                  {/*
                  <label>start x</label>
                  <input
                    value={x}
                    onChange={e => setX(e.target.value)}
                    disabled={burning}
                  />
                  <br />
                  <label>start y</label>
                  <input
                    value={y}
                    onChange={e => setY(e.target.value)}
                    disabled={burning}
                  />
                  */}
                  <label>Wind direction (0 degrees North)</label><br />
                  <input
                    value={wind}
                    onChange={e => setWind(e.target.value)}
                    disabled={burning}
                  />
                  <br />
                  <p>Click on the image to the right to put fire plots,<br />then click "start fire".</p>
                  <button onClick={clickResetFire.bind(this)} disabled={burning}>
                    Reset Fire
                  </button>
                  {!burning ? (
                    <button onClick={clickFireStart.bind(this)}>
                      Start Fire
                    </button>
                  ) : (
                    <button onClick={clickStopFire.bind(this)}>Stop Fire</button>
                  )}
                  <button onClick={e => setView("forest")} disabled={burning}>
                    Back to Forest
                  </button>
                </td>
              )}

              <td>
                <div className="forest-map mousepointer" style={{ position: "relative" }} onClick={setFireStartOnClick.bind(this)}>
                  <div className="grid topleft">
                    {estados.map((i, ii) => (
                      <div className="row" key={String(ii)}>
                        {i.map((j, iii) => {
                          return (
                            <div
                              key={String(iii) + String(ii)}
                              className="cell"
                              style={{ backgroundColor: getColor(j, u, v, n) }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <canvas id="canvas" width="300" height="300" ref={canvasRef} className="topleft"></canvas>
                  <div className="grid topleft">
                    {matrix.map((i, ii) => {
                      return (
                        <div className="row" key={String(ii)}>
                          {i.map((j, iii) => {
                            return (
                              <div
                                key={String(iii) + String(ii)}
                                className="cell"
                                style={{ backgroundColor: getFireColor(j) }}
                              ></div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                 <canvas className="mousepointer"
                   onClick={onClickReducedImage.bind(this)} 
                   id="canvas2" width="300" height="300" ref={canvasRef2}></canvas>
              </td>
              <td style={{ display: hasImage ? 'table-cell' : 'none' }}>
                <h5>Map Fuel Type</h5>
                <small>Click on the left map to select color</small>
                <table className="colors">
                  <tbody>
                    <tr>
                      <td></td>
                      <td>Color</td>
                      <td>Fuel</td>
                    </tr>
                    { palette.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <div className={"palette-item" + (selectedColor === c.join(',') ? " selected" : "")} style={{ backgroundColor: `rgba(${c[0]},${c[1]},${c[2]},${c[3]})` }}></div>
                        </td>
                        <td style={{ minWidth: '140px'}}>
                          {c[0]}, {c[1]}, {c[2]}, {c[3]}
                        </td>
                        <td>
                          <select style={{ fontSize: '9px' }}
                            onChange={e => onChangeColorMap(c.join(','), e.target.value)}
                            value={colorMap[c.join(',')]}>
                            <option value={0}>No fuel (0)</option>
                            <option value={u-1}>Young vegetation (a)</option>
                            <option value={v-1}>Adult vegetation (v)</option>
                            <option value={n}>Old vegetation (n)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                   
                 </table>
                 <button onClick={e => mapForestColors()}>
                    Apply Changes
                  </button>

              </td>
              <td>
                <div id="windy"></div>
              </td>
            </tr>
          </tbody>
        </table>

      <p style={{ clear: 'both' }}>
        Original work (FlorestaSim) by Oliveira, Maria da Graça de Andrade
        (2005) -
        <a target="_blank" href="https://hdl.handle.net/10216/11652">
          Propagação do Fogo e Dinâmicas Florestais
        </a>
      </p>
    </div>
  );
}
