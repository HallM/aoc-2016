import java.util.HashSet;
import java.util.ArrayList;

class Day11 {
  private final long startState =
      (1l | 128l | 256l | 512l | 32l | 64l | 4096l | 8192l)
    | ((2l | 4l) << floorShifts[1])
    | ((8l | 16l | 1024l | 2048l) << floorShifts[2]);

  public static final long maxItem = 8192;
  public static final long allMcs = 1 | 2 | 4 | 8 | 16 | 32 | 64;
  public static final long allGens = 128 | 256 | 512 | 1024 | 2048 | 4096 | 8192;
  public static final long finalSolution = allMcs | allGens;

  public static final long[] floorShifts = new long[] {0, 14, 28, 42};
  public static final long elevatorShift = 56;
  public static final long microchipShift = 0;
  public static final long generatorShift = 7;

  public static final long elevatorMask = 0x03l;
  public static final long allFloorsMask = 0x00FF_FFFF_FFFF_FFFFl;
  public static final long oneFloorMask = 0x3FFFl;
  public static final long halfFloorMask = 0x7Fl;

  private final HashSet<Long> seenStates;
  private ArrayList<Runner> currentRunners;

  private class Runner {
    private final long currentState;

    public Runner(final long state) {
      this.currentState = state;
    }

    public boolean makeRunners(ArrayList<Runner> nextRunners) {
      final int floorIndex = Day11.getElevator(this.currentState);
      final long floorItems = Day11.getFloorItems(this.currentState, floorIndex);

      if (floorIndex == 3 && floorItems == Day11.finalSolution) {
        return true;
      }

      final int upFloor = floorIndex + 1;
      final int downFloor = floorIndex - 1;

      final boolean canGoUp = floorIndex < 3;
      final boolean canGoDown = floorIndex > 0;

      for (long i = 1; i <= maxItem; i = i << 1) {
        if ((floorItems & i) == 0) {
          continue;
        }

        // start at i, because i can travel alone
        // when j == i, it is basically i travelling alone. helps reduce code
        for (long j = i; j <= maxItem; j = j << 1) {
          if ((floorItems & j) == 0) {
            continue;
          }

          final long ij = i | j;

          if (canGoUp) {
            final long nextState = Day11.makeNewState(this.currentState, ij, floorIndex, upFloor);

            if (wouldStateBeOk(nextState) && addVisitedStateIfUnvisited(nextState)) {
              nextRunners.add(new Runner(nextState));
            }
          }
          if (canGoDown) {
            final long nextState = Day11.makeNewState(this.currentState, ij, floorIndex, downFloor);

            if (wouldStateBeOk(nextState) && addVisitedStateIfUnvisited(nextState)) {
              nextRunners.add(new Runner(nextState));
            }
          }
        }
      }

      return false;
    }
  }

  public Day11() {
    seenStates = new HashSet<Long>();
    currentRunners = new ArrayList<Runner>();
    currentRunners.add(new Runner(startState));
  }

  public int run() {
    int iterations = 0;

    while (this.currentRunners.size() > 0) {
      ArrayList<Runner> nextRunners = new ArrayList<Runner>();
      for (Runner runner : this.currentRunners) {
        if (runner.makeRunners(nextRunners)) {
          return iterations;
        }
      }
      iterations++;
      System.out.printf("iter: %d %d\n", iterations, nextRunners.size());
      this.currentRunners = nextRunners;
    }

    return -1;
  }

  public boolean addVisitedStateIfUnvisited(final long state) {
    final long hash = hashState(state);
    return this.seenStates.add(hash);
  }

  public static void main(String[] args) {
    final Day11 solver = new Day11();
    final int part2Solution = solver.run();
    System.out.printf("Part 2 solution: %d\n", part2Solution);
  }

  // utility functions
  public static long getFloorItems(final long state, final int floorIndex) {
    final long shift = floorShifts[floorIndex];
    return (state >> shift) & oneFloorMask;
  }

  public static int getElevator(final long state) {
    return (int)((state >> elevatorShift) & elevatorMask);
  }

  public static long makeNewState(final long oldState, final long changedItems, final int oldFloor, final int newFloor) {
    final long oldFloorShift = floorShifts[oldFloor];
    final long newFloorShift = floorShifts[newFloor];

    final long elevatorState = (long)newFloor << elevatorShift;

    final long xorBy = (changedItems << oldFloorShift) | (changedItems << newFloorShift);
    final long newStateNoElevator = (oldState ^ xorBy) & allFloorsMask;

    return newStateNoElevator | elevatorState;
  }

  public static boolean wouldGroupBeOk(final long groupItems) {
    final long gens = (groupItems >> generatorShift) & halfFloorMask;

    if (gens == 0) {
      return true;
    }

    final long mcs = groupItems & halfFloorMask;

    // when gen is 1, then we ignore that mc
    // when gen is 0, we need to know if the mc exists. basically AND mc with NOT gen
    return (mcs & ~(gens)) == 0;
  }

  public static boolean wouldStateBeOk(final long state) {
    for (int i = 0; i < 4; i++) {
      final long floorItems = getFloorItems(state, i);
      if (!wouldGroupBeOk(floorItems)) {
        return false;
      }
    }

    return true;
  }

  // optimize by understanding that states can be equivalent. a row with 1 pair is the same as any other row with 1 pair.
  public static long hashState(final long state) {
    return (
      (hashFloor(getFloorItems(state, 0)) << floorShifts[0])
      | (hashFloor(getFloorItems(state, 1)) << floorShifts[1])
      | (hashFloor(getFloorItems(state, 2)) << floorShifts[2])
      | (hashFloor(getFloorItems(state, 3)) << floorShifts[3])
      | ((long)getElevator(state) << elevatorShift)
    );
  }

  // the hash basically shifts the combinations in a way that still tracks matching "pairs"
  // yet if both MC and G are missing, it shifts it out of the way
  public static long hashFloor(final long floorItems) {
    long mcs = floorItems & halfFloorMask;
    long gens = (floorItems >> generatorShift) & halfFloorMask;

    long hashMc = 0;
    long hashGen = 0;

    while (mcs != 0 || gens != 0) {
      if ((mcs & 1) == 1 && (gens & 1) == 1) {
        hashMc = (hashMc << 1) | 1;
        hashGen = (hashGen << 1) | 1;
      } else if ((mcs & 1) == 1) {
        hashMc = (hashMc << 1) | 1;
        hashGen = (hashGen << 1);
      } else if ((gens & 1) == 1) {
        hashMc = (hashMc << 1);
        hashGen = (hashGen << 1) | 1;
      }

      mcs = mcs >> 1;
      gens = gens >> 1;
    }

    return hashMc | (hashGen << generatorShift);
  }

}
