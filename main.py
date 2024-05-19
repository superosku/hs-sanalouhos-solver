import random
from dataclasses import dataclass

raw_data = """
vomus
drida
aians
nilta
jiesp
aakoi
"""
data = raw_data.strip().split("\n")


def parse_words_from_file() -> list[str]:
    sanat = []
    blocked_words = {
        "jin",
        "art",
        "mirin",
    }
    with open ("nykysuomensanalista2024.csv") as f:
        for i, line in enumerate(f):
            if i == 0:
                continue
            word = line.split()[0].lower()
            if any(n in word for n in "0123456789-"):
                continue
            if len(word) < 3:
                continue
            if word in blocked_words:
                continue
            sanat.append(word)
    return sanat


def rec_find(
    data: list[str],
    i: int,
    j: int,
    word: str,
    used: set[tuple[int, int]],
) -> None | list[set[tuple[int, int]]]:
    '''
    Takes in a grid of characters, a word to find in the grid and a location where to find the word.
    The function is a recursive function.
    '''

    if i < 0 or i >= len(data) or j < 0 or j >= len(data[0]):
        return None

    if data[i][j] != word[0]:
        return None

    # current = (i, j)
    if len(word) == 1:
        return [used]
        # return [used & {current}]

    all_results = []

    for x in range(-1, 2):
        for y in range(-1, 2):
            if x == 0 and y == 0:
                continue
            pos = (i + x, j + y)
            if pos in used:
                continue
            result = rec_find(data, i+x, j+y, word[1:], used | {pos})
            if result:
                all_results += result

    return all_results


@dataclass
class Word:
    word: str
    locations: list[tuple[int, int]]

    def __hash__(self):
        return hash((
            self.word,
            # It should be enought to use the set in the has since the ordering does not matter
            tuple(self.locations)
        ))


print("Finding words from grid")

def find_words_for_grid(data: list[str], words: list[str]) -> set[Word]:
    word_results_set: set[Word] = set()

    for i in range(len(data)):
        for j in range(len(data[0])):
            for word in words:
                result = rec_find(data, i, j, word, {(i, j)})
                if result:
                    for r in result:
                        other_r: list[tuple[int, int]] = list(sorted(list(r)))
                        thing = Word(word=word, locations=other_r)
                        if thing not in word_results_set:
                            word_results_set.add(thing)

    return word_results_set


def words_overlap(word_1: set[tuple[int, int]], word_2: set[tuple[int, int]]) -> bool:
    return any(pos in word_1 for pos in word_2)


def build_word_id_to_non_overlapping_word_ids_map(word_results_list: list[Word]):
    mapping: dict[int, set[int]] = {}

    for i, word_1 in enumerate(word_results_list):
        i_set = set()
        for j, word_2 in enumerate(word_results_list):
            if i == j:
                continue
            if words_overlap(set(word_1.locations), set(word_2.locations)):
                continue
            i_set.add(j)
        mapping[i] = i_set
    return mapping


def random_guesser(current: list[Word], available_word_ids: set[int]) -> list[Word]:
    if len(available_word_ids) == 0:
        return current

    randomly_chosen_id = random.choice(list(available_word_ids))
    word = word_results_list[randomly_chosen_id]

    return random_guesser(
        current + [word],
        available_word_ids & word_id_to_non_overlapping_word_ids_map[randomly_chosen_id],
    )


def print_solution(solution: list[Word], data: list[str]):
    for i in range(len(data)):
        for j in range(len(data[0])):
            character = data[i][j]

            word = next((w for w in solution if (i, j) in w.locations), None)

            if word is None:
                print(character, end="")
                continue

            word_index = solution.index(word)

            # Random color based on word_index
            color = 31 + word_index % 6

            # Print character with the color
            print(f"\033[{color}m{character}", end="")

            # Reset the color
            print("\033[0m", end="")
        print()


def find_solution_randomizer(word_results_list: list[Word]) -> list[Word]:
    wanted_len = len(''.join(data))
    best_len = 0
    while True:
        found_words = random_guesser([], set(range(len(word_results_list))))
        found_words_total_len = sum(len(word.word) for word in found_words)
        if found_words_total_len > best_len or found_words_total_len == wanted_len:
            best_len = found_words_total_len

            found_words_str_list = sorted([w.word for w in found_words])
            print(f"{best_len}/{wanted_len} {found_words_str_list}")
            print_solution(found_words, data)

            if best_len == wanted_len:
                return found_words


words = parse_words_from_file()
word_results_list: list[Word] = list(find_words_for_grid(data, words))
word_id_to_non_overlapping_word_ids_map = build_word_id_to_non_overlapping_word_ids_map(word_results_list)
solution = find_solution_randomizer(word_results_list)
