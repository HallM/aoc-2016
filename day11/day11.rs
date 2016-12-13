use std::collections::HashSet;

const FLOOR_SHIFTS: [u64; 4] = [0, 14, 28, 42];
const ELEVATOR_SHIFT: u64 = 56;
const GENERATOR_SHIFT: u64 = 7;

const ELEVATOR_MASK: u64 = 0x03;
const ALL_FLOORS_MASK: u64 = 0x00FF_FFFF_FFFF_FFFF;
const ONE_FLOOR_MASK: u64 = 0x3FFF;
const HALF_FLOOR_MASK: u64 = 0x7F;

const INIT_STATE: u64 = (1 | 128 | 256 | 512 | 32 | 64 | 4096 | 8192)
    | ((2 | 4) << FLOOR_SHIFTS[1])
    | ((8 | 16 | 1024 | 2048) << FLOOR_SHIFTS[2]);

const ALL_COMPONENTS: [u64; 14] = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192];
const FINAL_SOLUTION: u64 = 1 | 2 | 4 | 8 | 16 | 32 | 64 |   128 | 256 | 512 | 1024 | 2048 | 4096 | 8192;

fn main() {
  let mut seen: HashSet<u64> = HashSet::new();
  let mut states: Vec<u64> = vec![INIT_STATE];
  let mut iterations = 0;

  while states.len() > 0 {
    states = match run_iteration(states, &mut seen) {
      Some(next_states) => next_states,
      None => {
        println!("done in {} iterations", iterations);
        vec![]
      },
    };

    iterations = iterations + 1;
    println!("iter: {} {}", iterations, states.len());
  }
}

fn run_iteration(states: Vec<u64>, seen: &mut HashSet<u64>) -> Option<Vec<u64>> {
  let mut next_states = Vec::new();

  for state in states {
    let res = run_state(&mut next_states, seen, state);
    if res {
      // println!("done in {} iterations", iterations);
      return None;
    }
  };

  Some(next_states)
}

fn run_state(next_states: &mut Vec<u64>, seen: &mut HashSet<u64>, current_state: u64) -> bool {
  let floor_index = get_elevator(current_state);
  let floor_items = get_floor_items(current_state, floor_index);

  if floor_index == 3 && floor_items == FINAL_SOLUTION {
    return true;
  }

  let can_go_up = floor_index < 3;
  let can_go_down = floor_index > 0;

  let up_floor = if can_go_up {
    floor_index + 1
  } else {
    floor_index
  };

  let down_floor = if can_go_down {
    floor_index - 1
  } else {
    floor_index
  };

  for (index, i) in ALL_COMPONENTS.into_iter().enumerate() {
    if (floor_items & i) == 0 {
      continue;
    }

    // start at i, because i can travel alone
    // when j == i, it is basically i travelling alone. helps reduce code
    for j in ALL_COMPONENTS[index..].into_iter() {
      if (floor_items & j) == 0 {
        continue;
      }

      let ij = i | j;

      if can_go_up {
        let next_state = make_new_state(current_state, ij, floor_index, up_floor);

        if would_state_be_ok(next_state) {
          let hash = hash_state(next_state);
          if seen.insert(hash) {
            next_states.push(next_state);
          }
        }
      }
      if can_go_down {
        let next_state = make_new_state(current_state, ij, floor_index, down_floor);

        if would_state_be_ok(next_state) {
          let hash = hash_state(next_state);
          if seen.insert(hash) {
            next_states.push(next_state);
          }
        }
      }
    }
  }

  false
}

fn get_floor_items(state: u64, floor_index: usize) -> u64 {
  let shift = FLOOR_SHIFTS[floor_index];
  (state >> shift) & ONE_FLOOR_MASK
}

fn get_elevator(state: u64) -> usize {
  ((state >> ELEVATOR_SHIFT) & ELEVATOR_MASK) as usize
}

fn make_new_state(old_state: u64, changed_items: u64, old_floor: usize, new_floor: usize) -> u64 {
  let old_floor_shift = FLOOR_SHIFTS[old_floor];
  let new_floor_shift = FLOOR_SHIFTS[new_floor];

  let elevator_state = (new_floor as u64) << ELEVATOR_SHIFT;

  let xor_by = (changed_items << old_floor_shift) | (changed_items << new_floor_shift);
  let new_state_no_elevator = (old_state ^ xor_by) & ALL_FLOORS_MASK;

  new_state_no_elevator | elevator_state
}

fn would_group_be_ok(group_items: u64) -> bool {
  let gens = (group_items >> GENERATOR_SHIFT) & HALF_FLOOR_MASK;
  let mcs = group_items & HALF_FLOOR_MASK;

  // if there's no generators, then the group is good. otherwise,
  // when gen is 1, then we ignore that mc
  // when gen is 0, we need to know if the mc exists. basically AND mc with NOT gen
  gens == 0 || (mcs & !(gens)) == 0
}

fn would_state_be_ok(state: u64) -> bool {
  would_group_be_ok(get_floor_items(state, 0)) &&
    would_group_be_ok(get_floor_items(state, 1)) &&
    would_group_be_ok(get_floor_items(state, 2)) &&
    would_group_be_ok(get_floor_items(state, 3))
}

// optimize by understanding that states can be equivalent. a row with 1 pair is the same as any other row with 1 pair.
fn hash_state(state: u64) -> u64 {
  (hash_floor(get_floor_items(state, 0)) << FLOOR_SHIFTS[0]) |
    (hash_floor(get_floor_items(state, 1)) << FLOOR_SHIFTS[1]) |
    (hash_floor(get_floor_items(state, 2)) << FLOOR_SHIFTS[2]) |
    (hash_floor(get_floor_items(state, 3)) << FLOOR_SHIFTS[3]) |
    ((get_elevator(state) as u64) << ELEVATOR_SHIFT)
}

// the hash basically shifts the combinations in a way that still tracks matching "pairs"
// yet if both MC and G are missing, it shifts it out of the way
fn hash_floor(floor_items: u64) -> u64 {
  let mut mcs = floor_items & HALF_FLOOR_MASK;
  let mut gens = (floor_items >> GENERATOR_SHIFT) & HALF_FLOOR_MASK;

  let mut hash_mc: u64 = 0;
  let mut hash_gen: u64 = 0;

  while mcs != 0 || gens != 0 {
    if (mcs & 1) == 1 && (gens & 1) == 1 {
      hash_mc = (hash_mc << 1) | 1;
      hash_gen = (hash_gen << 1) | 1;
    } else if (mcs & 1) == 1 {
      hash_mc = (hash_mc << 1) | 1;
      hash_gen = hash_gen << 1;
    } else if (gens & 1) == 1 {
      hash_mc = hash_mc << 1;
      hash_gen = (hash_gen << 1) | 1;
    }

    mcs = mcs >> 1;
    gens = gens >> 1;
  }

  hash_mc | (hash_gen << GENERATOR_SHIFT)
}
