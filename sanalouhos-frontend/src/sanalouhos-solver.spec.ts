import {
  BuildWordIdToNonOverlappingWordIdsMap, buildWordWithHashable,
  FindWordsForGrid,
  Grid, posPairToHashable,
  recFind,
  WordsOverlap
} from "./sanalouhos-solver";

if (!Set.prototype.intersection) {
  Set.prototype.intersection = function (otherSet) {
    return new Set([...Array.from(this)].filter(x => otherSet.has(x)));
  };
}

describe("Grid", () => {
  it("rectangular", () => {
    const grid = new Grid([
      ["m", "l"],
      ["o", "i"],
    ]);
    expect(grid.width).toEqual(2);
    expect(grid.height).toEqual(2);
    expect(grid.getAt(0, 0)).toEqual("m");
    expect(grid.getAt(1, 0)).toEqual("l");
    expect(grid.getAt(0, 1)).toEqual("o");
    expect(grid.getAt(1, 1)).toEqual("i");
  });

  it("wide", () => {
    const grid = new Grid([
      ["m", "l", "u"],
      ["o", "i", "q"],
    ]);
    expect(grid.width).toEqual(3);
    expect(grid.height).toEqual(2);
    expect(grid.getAt(0, 0)).toEqual("m");
    expect(grid.getAt(1, 0)).toEqual("l");
    expect(grid.getAt(2, 0)).toEqual("u");
    expect(grid.getAt(0, 1)).toEqual("o");
    expect(grid.getAt(1, 1)).toEqual("i");
    expect(grid.getAt(2, 1)).toEqual("q");
  });

  it("tall", () => {
    const grid = new Grid([
      ["m", "l"],
      ["o", "i"],
      ["u", "1"],
    ]);
    expect(grid.width).toEqual(2);
    expect(grid.height).toEqual(3);
    expect(grid.getAt(0, 0)).toEqual("m");
    expect(grid.getAt(1, 0)).toEqual("l");
    expect(grid.getAt(0, 1)).toEqual("o");
    expect(grid.getAt(1, 1)).toEqual("i");
    expect(grid.getAt(0, 2)).toEqual("u");
    expect(grid.getAt(1, 2)).toEqual("1");
  });
})

describe("RecFind", () => {
  it("should find a word in the grid", () => {
    const grid = new Grid([
      ["m", "l"],
      ["o", "i"],
    ]);

    const result = recFind(grid, 0, 0, "mlo", new Set(), []);
    expect(result).toBeDefined();
    expect(result?.length).toEqual(1);
    expect(result?.[0].positions.size).toEqual(2); // This function does not handle adding the initial pos
    expect(result?.[0].sortedPositions.length).toEqual(2); // This function does not handle adding the initial pos
    expect(result?.[0].sortedPositions).toEqual([
      {x: 1, y: 0},
      {x: 0, y: 1}
    ]);
  });

  it("should find a word in the grid wide", () => {
    const grid = new Grid([
      ["m", "l", "p"],
      ["o", "i", "u"],
    ]);

    const result = recFind(grid, 0, 0, "mlu", new Set(), []);
    expect(result).toBeDefined();
    expect(result?.length).toEqual(1);
    expect(result?.[0].positions.size).toEqual(2); // This function does not handle adding the initial pos
    expect(result?.[0].sortedPositions.length).toEqual(2); // This function does not handle adding the initial pos
    expect(result?.[0].sortedPositions).toEqual([
      {x: 1, y: 0},
      {x: 2, y: 1}
    ]);
  });

  it("should find a word in the grid tall", () => {
    const grid = new Grid([
      ["m", "l"],
      ["o", "i"],
      ["p", "a"],
    ]);

    const result = recFind(grid, 0, 0, "mip", new Set(), []);
    expect(result).toBeDefined();
    expect(result?.length).toEqual(1);
    expect(result?.[0].positions.size).toEqual(2); // This function does not handle adding the initial pos
    expect(result?.[0].sortedPositions.length).toEqual(2); // This function does not handle adding the initial pos
    expect(result?.[0].sortedPositions).toEqual([
      {x: 1, y: 1},
      {x: 0, y: 2}
    ]);
  });
})


describe("FindWordsForGrid", () => {
  it("should find words in a grid", () => {
    const grid = new Grid([
      ["m", "l"],
      ["o", "i"],
    ]);

    const words = FindWordsForGrid(["mlo", "asdf"], grid);
    expect(words.length).toEqual(1);
    expect(words[0].word).toEqual("mlo");
    expect(words[0].positions.size).toEqual(3);
    expect(words[0].sortedPositions).toEqual(
      [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}]
    );
  });

  it("should find words in a grid four", () => {
    const grid = new Grid([
      ["m", "l"],
      ["o", "i"],
    ]);

    const words = FindWordsForGrid(["mloi", "asdf"], grid);
    expect(words.length).toEqual(1);
    expect(words[0].word).toEqual("mloi");
    expect(words[0].positions.size).toEqual(4);
    expect(words[0].sortedPositions).toEqual(
      [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}]
    );
  });

  it("should find words in a grid tall", () => {
    const grid = new Grid([
      ["m", "l"],
      ["o", "i"],
      ["a", "v"],
    ]);

    const words = FindWordsForGrid(["avim", "asdf"], grid);
    expect(words.length).toEqual(1);
    expect(words[0].word).toEqual("avim");
    expect(words[0].positions.size).toEqual(4);
    expect(words[0].sortedPositions).toEqual(
      [{x: 0, y: 2}, {x: 1, y: 2}, {x: 1, y: 1}, {x: 0, y: 0}]
    );
  });

  it("should find words in a grid wide", () => {
    const grid = new Grid([
      ["m", "l", "a"],
      ["o", "i", "v"],
    ]);

    const words = FindWordsForGrid(["avim", "asdf"], grid);
    expect(words.length).toEqual(1);
    expect(words[0].word).toEqual("avim");
    expect(words[0].positions.size).toEqual(4);
    expect(words[0].sortedPositions).toEqual(
      [{x: 2, y: 0}, {x: 2, y: 1}, {x: 1, y: 1}, {x: 0, y: 0}]
    );
  });
});

describe("WordsOverlap", () => {
  it("when no overlap", () => {
    const word1 = new Set([{x: 0, y: 0}, {x: 1, y: 0}]);
    const word2 = new Set([{x: 2, y: 0}, {x: 3, y: 0}]);

    expect(WordsOverlap(
      new Set(Array.from(word1).map(w => posPairToHashable(w))),
      new Set(Array.from(word2).map(w => posPairToHashable(w))),
    )).toBe(false);
  })

  it("when overlap", () => {
    const word1 = new Set([{x: 0, y: 0}, {x: 1, y: 0}]);
    const word2 = new Set([{x: 1, y: 0}, {x: 2, y: 0}]);

    expect(WordsOverlap(
      new Set(Array.from(word1).map(w => posPairToHashable(w))),
      new Set(Array.from(word2).map(w => posPairToHashable(w))),
    )).toBe(true);
  })
});

describe("BuildWordIdToNonOverlappingWordIdsMap", () => {
  it("with just one word", () => {
    const result = BuildWordIdToNonOverlappingWordIdsMap([
      buildWordWithHashable({word: "a", positions: new Set([{x: 0, y: 0}]), sortedPositions: []}),
    ])

    expect(result.size).toEqual(1);
    expect(Array.from(result.keys())).toEqual([0]);
    expect(result.get(0)).toEqual(new Set([]));
  });

  it("with three words", () => {
    const result = BuildWordIdToNonOverlappingWordIdsMap([
      buildWordWithHashable({word: "a", positions: new Set([{x: 0, y: 0}, {x: 1, y: 0}]), sortedPositions: []}),
      buildWordWithHashable({word: "b", positions: new Set([{x: 1, y: 0}, {x: 2, y: 0}]), sortedPositions: []}),
      buildWordWithHashable({word: "c", positions: new Set([{x: 2, y: 0}, {x: 3, y: 0}]), sortedPositions: []}),
    ])

    const resultSortedList = Array
      .from(result.entries())
      .sort((a, b) => a[0] - b[0])
      .map(
        ([key, value]) =>
          [key, Array.from(value).sort((a, b) => a - b)]
      );

    expect(resultSortedList).toEqual([
      [0, [2]],
      [1, []],
      [2, [0]]
    ]);
  });
});
