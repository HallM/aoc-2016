#include <cstdint>
#include <iostream>
#include <unordered_set>
#include <vector>

using std::uint64_t;
using std::uint32_t;
using std::unordered_set;
using std::vector;
using std::pair;
using std::cout;
using std::hex;
using std::endl;

typedef uint64_t StateType;
typedef uint64_t FloorType;

const StateType FLOOR_SHIFTS[4] = { 0, 14, 28, 42 };
const StateType ELEVATOR_SHIFT = 56;
const StateType GENERATOR_SHIFT = 7;

const StateType ELEVATOR_MASK = 0x03ULL;
const StateType ALL_FLOORS_MASK = 0x00FFFFFFFFFFFFFFULL;
const StateType ONE_FLOOR_MASK = 0x3FFFULL;
const StateType HALF_FLOOR_MASK = 0x7FULL;

const StateType INIT_STATE = (1ULL | 128ULL | 256ULL | 512ULL | 32ULL | 64ULL | 4096ULL | 8192ULL)
    | ((2 | 4) << FLOOR_SHIFTS[1])
    | ((8ULL | 16ULL | 1024ULL | 2048ULL) << FLOOR_SHIFTS[2]);

const StateType ALL_COMPONENTS[14] = { 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192 };
const StateType FINAL_SOLUTION = 1 | 2 | 4 | 8 | 16 | 32 | 64 |   128 | 256 | 512 | 1024 | 2048 | 4096 | 8192;

bool run_iteration(vector<StateType> *next_states, vector<StateType> *states, unordered_set<StateType> &seen);
bool run_state(vector<StateType> *next_states, unordered_set<StateType> &seen, StateType current_state);
StateType get_floor_items(StateType state, FloorType floor_index);
FloorType get_elevator(StateType state);
StateType make_new_state(StateType old_state, StateType changed_items, FloorType old_floor, FloorType new_floor);
bool would_group_be_ok(StateType group_items);
bool would_state_be_ok(StateType state);
StateType hash_state(StateType state);
StateType hash_floor(StateType floor_items);

int main() {
  unordered_set<StateType> seen;
  vector<StateType> *states = new vector<StateType>();
  states->push_back(INIT_STATE);
  vector<StateType> *next_states = NULL;
  int iterations = 0;

  // cout << "shift 0: " << FLOOR_SHIFTS[0] << endl;
  // cout << "shift 1: " << FLOOR_SHIFTS[1] << endl;
  // cout << "shift 2: " << FLOOR_SHIFTS[2] << endl;
  // cout << "shift 3: " << FLOOR_SHIFTS[3] << endl;
  // cout << "init: " << hex << INIT_STATE << endl;
  // cout << "elevator: " << get_elevator(INIT_STATE) << endl;
  // cout << "floor 4 items: " << hex << get_floor_items(INIT_STATE, 3) << endl;
  // cout << "final solution: " << hex << FINAL_SOLUTION << endl;

  while (states->size() > 0) {
    next_states = new vector<StateType>();

    if (run_iteration(next_states, states, seen)) {
      cout << "done in " << iterations << " iterations" << endl;
      break;
    }

    delete states;
    states = next_states;
    next_states = NULL;

    iterations = iterations + 1;
    cout << "iter " << iterations << " " << states->size() << endl;
    // break;
  }

  if (states) {
    delete states;
  }
  if (next_states) {
    delete next_states;
  }

  return 0;
}

bool run_iteration(vector<StateType> *next_states, vector<StateType> *states, unordered_set<StateType> &seen) {
  for (auto it = states->begin() ; it < states->end(); it++) {
    auto state = *it;

    if (run_state(next_states, seen, state)) {
      return true;
    }
  };

  return false;
}

bool run_state(vector<StateType> *next_states, unordered_set<StateType> &seen, StateType current_state) {
  FloorType floor_index = get_elevator(current_state);
  StateType floor_items = get_floor_items(current_state, floor_index);

  if (floor_index == 3 && floor_items == FINAL_SOLUTION) {
    return true;
  }

  bool can_go_up = floor_index < 3;
  bool can_go_down = floor_index > 0;

  FloorType up_floor = can_go_up ? (floor_index + 1) : floor_index;
  FloorType down_floor = can_go_down ? (floor_index - 1) : floor_index;

  for (StateType i = 1; i <= 8192; i = i << 1) {
    if ((floor_items & i) == 0) {
      continue;
    }

    // start at i, because i can travel alone
    // when j == i, it is basically i travelling alone. helps reduce code
    for (StateType j = i; j <= 8192; j = j << 1) {
      if ((floor_items & j) == 0) {
        continue;
      }

      StateType ij = i | j;

      if (can_go_up) {
        StateType next_state = make_new_state(current_state, ij, floor_index, up_floor);

        if (would_state_be_ok(next_state)) {
          StateType hash = hash_state(next_state);
          if (seen.insert(hash).second) {
            next_states->push_back(next_state);
          }
        }
      }
      if (can_go_down) {
        StateType next_state = make_new_state(current_state, ij, floor_index, down_floor);

        if (would_state_be_ok(next_state)) {
          StateType hash = hash_state(next_state);
          if (seen.insert(hash).second) {
            next_states->push_back(next_state);
          }
        }
      }
    }
  }

  return false;
}

StateType get_floor_items(StateType state, FloorType floor_index) {
  StateType shift = FLOOR_SHIFTS[floor_index];
  return (state >> shift) & ONE_FLOOR_MASK;
}

FloorType get_elevator(StateType state) {
  return (FloorType)((state >> ELEVATOR_SHIFT) & ELEVATOR_MASK);
}

StateType make_new_state(StateType old_state, StateType changed_items, FloorType old_floor, FloorType new_floor) {
  StateType old_floor_shift = FLOOR_SHIFTS[old_floor];
  StateType new_floor_shift = FLOOR_SHIFTS[new_floor];

  StateType elevator_state = ((StateType)new_floor) << ELEVATOR_SHIFT;

  StateType xor_by = (changed_items << old_floor_shift) | (changed_items << new_floor_shift);
  StateType new_state_no_elevator = (old_state ^ xor_by) & ALL_FLOORS_MASK;

  return new_state_no_elevator | elevator_state;
}

bool would_group_be_ok(StateType group_items) {
  StateType gens = (group_items >> GENERATOR_SHIFT) & HALF_FLOOR_MASK;
  StateType mcs = group_items & HALF_FLOOR_MASK;

  // if there's no generators, then the group is good. otherwise,
  // when gen is 1, then we ignore that mc
  // when gen is 0, we need to know if the mc exists. basically AND mc with NOT gen
  return gens == 0 || (mcs & ~(gens)) == 0;
}

bool would_state_be_ok(StateType state) {
  return would_group_be_ok(get_floor_items(state, 0)) &&
    would_group_be_ok(get_floor_items(state, 1)) &&
    would_group_be_ok(get_floor_items(state, 2)) &&
    would_group_be_ok(get_floor_items(state, 3));
}

// optimize by understanding that states can be equivalent. a row with 1 pair is the same as any other row with 1 pair.
StateType hash_state(StateType state) {
  return (hash_floor(get_floor_items(state, 0)) << FLOOR_SHIFTS[0]) |
    (hash_floor(get_floor_items(state, 1)) << FLOOR_SHIFTS[1]) |
    (hash_floor(get_floor_items(state, 2)) << FLOOR_SHIFTS[2]) |
    (hash_floor(get_floor_items(state, 3)) << FLOOR_SHIFTS[3]) |
    (((StateType)get_elevator(state)) << ELEVATOR_SHIFT);
}

// the hash basically shifts the combinations in a way that still tracks matching "pairs"
// yet if both MC and G are missing, it shifts it out of the way
StateType hash_floor(StateType floor_items) {
  StateType mcs = floor_items & HALF_FLOOR_MASK;
  StateType gens = (floor_items >> GENERATOR_SHIFT) & HALF_FLOOR_MASK;

  StateType hash_mc = 0;
  StateType hash_gen = 0;

  while (mcs != 0 || gens != 0) {
    if ((mcs & 1) == 1 && (gens & 1) == 1) {
      hash_mc = (hash_mc << 1) | 1;
      hash_gen = (hash_gen << 1) | 1;
    } else if ((mcs & 1) == 1) {
      hash_mc = (hash_mc << 1) | 1;
      hash_gen = hash_gen << 1;
    } else if ((gens & 1) == 1) {
      hash_mc = hash_mc << 1;
      hash_gen = (hash_gen << 1) | 1;
    }

    mcs = mcs >> 1;
    gens = gens >> 1;
  }

  return hash_mc | (hash_gen << GENERATOR_SHIFT);
}
