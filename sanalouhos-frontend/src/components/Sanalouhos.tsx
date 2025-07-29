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
  const getColumnThings = React.useMemo(() => {
    return (word: Word, foundIndex: number, x: number, y: number) => {
      // if (bestGuess === undefined) {
      //   return <></>;
      // }
      // for (let i = 0; i < bestGuess.length; i++) {
      //   const word = bestGuess[i];

        // const foundIndex = word.sortedPositions.findIndex((pos => pos.x === x && pos.y === y));
        //
        // if (foundIndex !== -1) {
          let span1 = undefined;
          let span2 = undefined;

          if (foundIndex > 0) {
            const xDirection = word.sortedPositions[foundIndex - 1].x - x;
            const yDirection = word.sortedPositions[foundIndex - 1].y - y;
            // x and y dir are -1, 0, or 1, calculate rotation based on them. Use math with cosin and sine
            const angle = Math.atan2(-xDirection, yDirection);

            span1 = <span
              className={`solution-shower non-start`}
              style={{
                top: `${y * 34 + 17}px`,
                left: `${x * 34 + 17}px`,
              }}
            >
              <span
                className={`inner`}
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

            const isStart = foundIndex === 0;

            span2 = <span
              className={`solution-shower ${isStart ? "start" : "non-start"}`}
              style={{
                top: `${y * 34 + 17}px`,
                left: `${x * 34 + 17}px`,
              }}

            >
              <span
                className={`inner`}
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
  }, [bestGuess]);

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
      <h1>Sanalouhos</h1>
      <p>Welcome to the Sanalouhos component!</p>
      <div className={"table-and-solution-container"}>
        <table className={"sanalouhos-table"}>
          <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>
                  <input
                    className={"sanalouhos-input"}
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

                      // If out of bounds, focus on the first cell
                      if (nextRow >= data.length) {
                        inputRefs.current[0][0]?.focus();
                      } else {
                        inputRefs.current[nextRow][nextCell]?.focus();
                      }
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
          </tbody>
        </table>
        {bestGuess && <SolutionOverlay bestGuess={bestGuess} />}
      </div>

      <button
        onClick={() => {
          if (intervalId) {
            window.clearInterval(intervalId);
            setIntervalId(undefined);
          }

          const grid = new Grid(data)
          console.log("grid: ", grid, "data: ", data)
          const foundWords = FindWordsForGrid(allWords, grid);
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
        Solve
      </button>
      {guessValue !== undefined &&
        <h3>{guessValue} / {charactersToGuess}</h3>
      }
    </div>
  );
}
