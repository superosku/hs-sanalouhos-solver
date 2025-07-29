import './Sanalouhos.scss';
import React from "react";
import {
  BuildWordIdToNonOverlappingWordIdsMap,
  FindWordsForGrid,
  Grid, posPairToHashable,
  RandomGuesser, Word
} from "../sanalouhos-solver";

// eslint-disable-next-line import/no-webpack-loader-syntax
import rawWords from '!!raw-loader!../nykysuomensanalista2024.csv';


const loadRawWords = () : string[] => {
  const lines = rawWords.split('\n').slice(1, -1);
  const words = lines.map(line => {
    return line.split('\t')[0];
  }).filter(word => {
    if (word.length <= 3) {
      return false;
    }
    if ([
      "maki",
    ].findIndex(w => w === word) !== -1) {
      return false;
    }
    return true;
  });

  return words;
}

export const allWords = loadRawWords();


const SolutionOverlay = ({bestGuess}: {bestGuess: Word[]}) => {
  // const gridSize = 80;

  // Grid size is parent element width divided by 5

  const findGridSize = () => {
    const parentElement = document.querySelector('.sanalouhos-table');
    if (parentElement) {
      console.log("Finding gridSize: ", parentElement.clientWidth, " / 5 = ", parentElement.clientWidth / 5)
      return parentElement.clientWidth / 5;
    }
    console.warn("Could not find parent element for grid size, returning default size");
    return 80; // default size
  }

  // const gridSize = React.useMemo(() => {
  //   return findGridSize();
  // }, []);
  const [gridSize, setGridSize] = React.useState(findGridSize);

  // Update girdSize when window resizes

  React.useEffect(() => {
    const handleResize = () => {
      // Force re-render to update grid size
      // setTimeout(() => {
      setGridSize(findGridSize());
        // This will trigger a re-render
      // }, 0);
    };

    console.log("adding resize listener, gridSize: ", gridSize)
    window.addEventListener('resize', handleResize);
    return () => {
      console.log("removing resize listener, gridSize: ", gridSize)
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getColumnThings = React.useMemo(() => {
    return (word: Word, foundIndex: number, x: number, y: number) => {
          let span1 = undefined;
          let span2 = undefined;

          if (foundIndex > 0) {
            const xDirection = word.sortedPositions[foundIndex - 1].x - x;
            const yDirection = word.sortedPositions[foundIndex - 1].y - y;
            // x and y dir are -1, 0, or 1, calculate rotation based on them. Use math with cosin and sine
            const angle = Math.atan2(-xDirection, yDirection);
            const isCornerToCorner = (xDirection !== 0 && yDirection !== 0);

            span1 = <span
              className={`solution-shower non-start`}
              style={{
                top: `${(y + 0.5) * gridSize}px`,
                left: `${(x + 0.5) * gridSize}px`,
              }}
            >
              <span
                className={`inner ${isCornerToCorner ? "corner-to-corner" : ""}`}
                style={{
                  transform: `rotate(${angle}rad)`,
                  // width: "1em",
                  // height: "1em",
                  // display: "inline-block",
                }}
              ></span>
            </span>;
          }
          if (foundIndex < word.sortedPositions.length - 1) {
            const xDirection = word.sortedPositions[foundIndex + 1].x - x;
            const yDirection = word.sortedPositions[foundIndex + 1].y - y;
            // x and y dir are -1, 0, or 1, calculate rotation based on them. Use math with cosin and sine
            const angle = Math.atan2(-xDirection, yDirection);

            const isCornerToCorner = (xDirection !== 0 && yDirection !== 0);
            const isStart = foundIndex === 0;

            span2 = <span
              className={`solution-shower ${isStart ? "start" : "non-start"}`}
              style={{
                top: `${(y + 0.5) * gridSize}px`,
                left: `${(x + 0.5) * gridSize}px`,
              }}

            >
              <span
                className={`inner ${isCornerToCorner ? "corner-to-corner" : ""}`}
                style={{
                  transform: `rotate(${angle}rad)`,
                }}
              ></span>
              {isStart && <span className={"word-start-circle"}></span>}
            </span>;
          }

          return <>
            {span1} {span2}
          </>
        // }
      // }
      // return <>
      // </>
    }
  }, [bestGuess, gridSize]);

  return <div className={"solution-overlay"}>
    {bestGuess.map(guessedWord => {
      return <>{guessedWord.sortedPositions.map((pos, index) => {
        return getColumnThings(guessedWord, index, pos.x, pos.y);
      })}</>
    })}

  </div>
}


export const Sanalouhos = () => {
  // Data is a 4x4 grid of strings
  const [data, setData] = React.useState<string[][]>([
    ["m", "l", "a", "l", "u"],
    ["e", "i", "l", "t", "a"],
    ["k", "e", "u", "t", "a"],
    ["i", "n", "m", "k", "m"],
    ["u", "t", "u", "h", "i"],
    ["t", "a", "a", "l", "e"],
  ]);
  const inputRefs = React.useRef<(null | HTMLInputElement)[][]>([
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
  ])

  const [bestGuess, setBestGuess] = React.useState<Word[] | undefined>(undefined);
  const [intervalId, setIntervalId] = React.useState<number | undefined>(undefined);

  const [blockWordsString, setBlockWordsString] = React.useState<string>("jin,art,mirin,eau");

  const blockWords = React.useMemo(() => {
    return blockWordsString.split(',').map(word => word.trim().toLowerCase()).filter(word => word.length > 0);
  }, [blockWordsString])

  const allWordsButBlocked = React.useMemo(() => {
    return allWords.filter(word => {
      return blockWords.findIndex(blockedWord => blockedWord.toLowerCase() === word.toLowerCase()) === -1;
    });
  }, [blockWords]);

  const guessValue = React.useMemo<undefined | number>(() => {
    if (bestGuess !== undefined) {
      return bestGuess.reduce((acc, word) => {
        return acc + word.word.length;
      }, 0);
    }
    return undefined
  }, [bestGuess]);

  const charactersToGuess= React.useMemo(() => {
    return data.length * data[0].length;
  }, [data])


  return (
    <div className="sanalouhos">
      <h1>Sanalouhos Solver</h1>
      <h3>Blocked words:</h3>
      <input type={"text"} value={blockWordsString} onChange={
        (e) => {
          setBlockWordsString(e.target.value);
        }
      }>

      </input>

      <div className={"table-and-solution-container"}>
        {bestGuess && <SolutionOverlay bestGuess={bestGuess} />}
        <table className={"sanalouhos-table"}>
          <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => {
                const partOfSolution = bestGuess && bestGuess.find(word => {
                  return word.sortedPositions.some(pos => {
                    return pos.x === cellIndex && pos.y === rowIndex;
                  });
                });

                return <td key={cellIndex}>
                  <div className={"input-wrapper"}>
                    <input
                      className={"sanalouhos-input " + (partOfSolution ? "part-of-solution" : "not-part-of-solution")}
                      type="text"
                      ref={(el) => {
                        if (el) {
                          inputRefs.current[rowIndex][cellIndex] = el;
                        }
                      }}
                      value={cell}
                      onChange={(e) => {
                        const nextCell = cellIndex === row.length - 1 ? 0 : cellIndex + 1;
                        const nextRow = nextCell === 0 ? rowIndex + 1 : rowIndex;

                        const newData = [...data];
                        const inputData = e.target.value;
                        const lastLetter = inputData.slice(-1).toLowerCase();
                        newData[rowIndex][cellIndex] = lastLetter;
                        setData(newData);
                        setBestGuess(undefined);

                        // If out of bounds, focus on the first cell
                        if (nextRow >= data.length) {
                          inputRefs.current[0][0]?.focus();
                        } else {
                          inputRefs.current[nextRow][nextCell]?.focus();
                        }
                      }}
                    />
                  </div>
                </td>
              })}
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => {
          setBestGuess(undefined);
          if (intervalId) {
            window.clearInterval(intervalId);
            setIntervalId(undefined);
          }

          const grid = new Grid(data)
          console.log("grid: ", grid, "data: ", data)
          const foundWords = FindWordsForGrid(allWordsButBlocked, grid);
          const mapping = BuildWordIdToNonOverlappingWordIdsMap(foundWords);
          const allWordIdSet = new Set(foundWords.map((w, i) => i))

          let curBestGuessLen = 0;

          const scopedIntervalId = window.setInterval(() => {
            let guessValue = 0;
            let randomGuess: Word[] = [];
            for (let i = 0; i < 1000; i ++) {
              randomGuess = RandomGuesser(
                foundWords,
                mapping,
                [],
                allWordIdSet,
              )

              guessValue = randomGuess.reduce((acc, word) => {
                return acc + word.word.length;
              }, 0)

              if (guessValue > curBestGuessLen) {
                break
              }
            }

            if (guessValue < curBestGuessLen) {
              return;
            }
            curBestGuessLen = guessValue;

            setBestGuess(randomGuess);

            if (guessValue === grid.width * grid.height) {
              window.clearInterval(scopedIntervalId);
              setIntervalId(undefined);
            }
          })

          setIntervalId(scopedIntervalId);
        }}
      >
        {intervalId ? "Solving..." : "Solve"}
      </button>
      {guessValue !== undefined &&
        <h3>Found: {guessValue} / {charactersToGuess}</h3>
      }
    </div>
  );
}
