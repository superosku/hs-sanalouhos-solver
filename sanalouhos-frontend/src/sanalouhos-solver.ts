

export class Grid {
  data: string;
  width: number;
  height: number;

  getAt(x: number, y: number): string {
    return this.data[x + this.width * y];
  }

  constructor(data: string[][]) {
    this.data = data.flat().join('');
    this.width = data[0].length;
    this.height = data.length;
  }
}

type PosPair = {
  x: number;
  y: number;
};

export const posPairToHashable = (pos: PosPair): PosPairHashable => {
  return `${pos.x},${pos.y}`;
}

type PosPairHashable = string;

interface IRecFindResult {
  positions: Set<PosPair>;
  sortedPositions: PosPair[];
}

export const recFind = (
  grid: Grid,
  i: number,
  j: number,
  word: string,
  used: Set<PosPair>,
  sortedUsed: PosPair[],
): undefined | IRecFindResult[] => {
  if (i < 0 || i >= grid.width || j < 0 || j >= grid.height) {
    return undefined;
  }
  if (grid.getAt(i, j) !== word[0]) {
    return undefined;
  }
  if (word.length === 1) {
    return [{positions: used, sortedPositions: sortedUsed}];
  }

  let allResults: IRecFindResult[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      if (x === 0 && y === 0) {
        continue
      }
      const pos: PosPair = {x: i + x, y: j + y};
      if (sortedUsed.findIndex(p => p.x === pos.x && p.y === pos.y) !== -1) {
      // if (used.has(pos)) {
        continue;
      }
      const result = recFind(
        grid,
        i + x,
        j + y,
        word.slice(1),
        new Set(used).add(pos),
        sortedUsed.concat([pos])
      );
      if (result !== undefined) {
        allResults = allResults.concat(result);
      }
    }
  }
  return allResults;
}

export type Word = {
  word: string;
  sortedPositions: PosPair[];
  positions: Set<PosPair>;
  hashablePositions: Set<PosPairHashable>;
};

export const buildWordWithHashable = ({word, positions, sortedPositions}: {word: string, positions: Set<PosPair>, sortedPositions: PosPair[]}): Word => {
  return {
    word: word,
    positions: positions,
    sortedPositions: sortedPositions,
    hashablePositions: new Set<PosPairHashable>(Array.from(positions).map(pos => posPairToHashable(pos)))
  };
}

export const FindWordsForGrid = (allWords: string[], grid: Grid): Word[] => {
  let wordsFound: Set<Word> = new Set<Word>();

  for (let x = 0; x < grid.width; x++) {
    for (let y = 0; y < grid.height; y++) {
      for (const word of allWords) {
        // Test all words for this starting position
        const results = recFind(grid, x, y, word, new Set<PosPair>([{ x, y}]), [{x, y}]);
        if (results !== undefined) {
          // Found potentially multiple instances of this word starting from here
          for (const result of results) {
            wordsFound.add(buildWordWithHashable({
              word: word,
              positions: result.positions,
              sortedPositions: result.sortedPositions,
            }))
          }
        }
      }
    }
  }

  return Array.from(wordsFound);
}

export const WordsOverlap = (word1: Set<PosPairHashable>, word2: Set<PosPairHashable>): boolean => {
  return word1.intersection(word2).size > 0;
}

export const BuildWordIdToNonOverlappingWordIdsMap = (words: Word[]): Map<number, Set<number>> => {
  let mapping = new Map<number, Set<number>>();
  for (let index1 = 0; index1 < words.length; index1++) {
    let index1Set = new Set<number>();
    for (let index2 = 0; index2 < words.length; index2++) {
      if (index1 === index2) {
        continue;
      }
      if (!WordsOverlap(words[index1].hashablePositions, words[index2].hashablePositions)) {
        index1Set.add(index2);
      }
    }
    mapping.set(index1, index1Set);
  }

  return mapping
}

export const RandomGuesser = (
  gridWords: Word[], // All words in a grid
  wordIdToNonOverlappingWordIdMap: Map<number, Set<number>>, // Map of word IDs to non-overlapping word IDs
  currentWords: Word[],
  availableWordIds: Set<number>
): Word[] => {
  // console.log("RandomGuesser", availableWordIds.size);
  if (availableWordIds.size === 0) {
    return currentWords;
  }

  const availableList= Array.from(availableWordIds)
  const randomIndex = Math.floor(Math.random() * availableList.length);
  const randomWordId = availableList[randomIndex];

  const randomWord = gridWords[randomWordId];
  const randomWordAvailableIds: Set<number> | undefined = wordIdToNonOverlappingWordIdMap.get(randomWordId);
  if (!randomWordAvailableIds) {
    throw new Error(`No available IDs for word ID ${randomWordId}`);
  }

  return RandomGuesser(
    gridWords,
    wordIdToNonOverlappingWordIdMap,
    [...currentWords, randomWord],
    availableWordIds.intersection(randomWordAvailableIds)
  )
}
