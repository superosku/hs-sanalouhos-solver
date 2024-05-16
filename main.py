import random

raw_data = """
joötä
urpnä
mrtni
piöyn
kapey
kotas
"""

data = raw_data.strip().split("\n")

sanat = []
with open ("nykysuomensanalista2024.csv") as f:
    for i, line in enumerate(f):
        if i == 0:
            continue
        word = line.split()[0].lower()
        if any(n in word for n in "0123456789-"):
            continue
        if len(word) < 3:
            continue
        sanat.append(word)


def rec_find(
    data: list[str],
    i: int,
    j: int,
    word: str,
    used: set[tuple[int, int]],
) -> None | list[set[tuple[int, int]]]:
    if i < 0 or i >= len(data) or j < 0 or j >= len(data[0]):
        return False

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

word_results: set[tuple[str, tuple[tuple[int, int]], ...]] = set()

for i in range(len(data)):
    for j in range(len(data[0])):
        for sana in sanat:
            result = rec_find(data, i, j, sana, {(i, j)})
            if result:
                for r in result:
                    r = tuple(sorted(list(r)))
                    thing = (sana, r)
                    if thing not in word_results:
                        word_results.add(thing)
                        print(thing)


# breakpoint()
# already_seen_sets = {}


def try_words(current: tuple[list, set]) -> tuple[list, set]:
    current_words, current_set = current

    best = current

    for word, used in word_results:
        # if len(current[0]) < 4:
        # print("  " * len(current[0]), word)
        if len(current_set | set(used)) != len(current_set) + len(set(used)):
            continue

        found_thing = try_words(
            (current_words + [word], current_set | set(used)),
        )

        if len(found_thing[1]) > len(best[1]):
            best = found_thing

    return best


word_results_list = list(word_results)


def random_guesser(current: tuple[list, set]) -> tuple[list, set]:
    current_words, current_set = current

    best = current

    random.shuffle(word_results_list)
    for word, used in word_results_list:
        if len(current_set | set(used)) != len(current_set) + len(set(used)):
            continue

        found_thing = random_guesser(
            (current_words + [word], current_set | set(used)),
        )
        return found_thing

    return best


# arg = ([], set())
# best = try_words(arg)
# print(best)

initial = ([], set())
best = initial
while True:
    found_thing = random_guesser(initial)
    if len(found_thing[1]) > len(best[1]):
        best = found_thing
        best_len = len(''.join(best[0]))
        wanted_len = len(''.join(data))
        print(f"{best_len}/{wanted_len} {best[0]}")
        if best_len == wanted_len:
            break

