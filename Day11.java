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
      // printState(this.currentState);

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
      // break;
    }

    return -1;
  }

  public boolean addVisitedStateIfUnvisited(final long state) {
    // printState(state);
    return this.seenStates.add(state);
  }

  public static void main(String[] args) {
    final Day11 solver = new Day11();
    final int part2Solution = solver.run();
    System.out.printf("Part 2 solution: %d\n", part2Solution);
  }

  // utility functions
  public static void printState(final long state) {
    System.out.printf("Elevator at: %d\n", getElevator(state) + 1);
    for (int i = 0; i < 4; i++) {
      System.out.printf("Floor %d:\n", i+1);
      printFloorState(getFloorItems(state, i));
    }
  }

  public static void printFloorState(final long floorItems) {
    if ((floorItems & 1) != 0) {
      System.out.println("thulium microchip");
    }
    if ((floorItems & 2) != 0) {
      System.out.println("plutonium microchip");
    }
    if ((floorItems & 4) != 0) {
      System.out.println("strontium microchip");
    }
    if ((floorItems & 8) != 0) {
      System.out.println("promethium microchip");
    }
    if ((floorItems & 16) != 0) {
      System.out.println("ruthenium microchip");
    }
    if ((floorItems & 32) != 0) {
      System.out.println("elerium microchip");
    }
    if ((floorItems & 64) != 0) {
      System.out.println("dilithium microchip");
    }

    if ((floorItems & 128) != 0) {
      System.out.println("thulium generator");
    }
    if ((floorItems & 256) != 0) {
      System.out.println("plutonium generator");
    }
    if ((floorItems & 512) != 0) {
      System.out.println("strontium generator");
    }
    if ((floorItems & 1024) != 0) {
      System.out.println("promethium generator");
    }
    if ((floorItems & 2048) != 0) {
      System.out.println("ruthenium generator");
    }
    if ((floorItems & 4096) != 0) {
      System.out.println("elerium generator");
    }
    if ((floorItems & 8192) != 0) {
      System.out.println("dilithium generator");
    }
  }

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

  // public static boolean hasMatchingGenerator(final long groupItems, final long mcId) {
  //   final long genId = mcId << generatorShift;
  //   return (groupItems & genId) != 0;
  // }
  // public static boolean hasMatchingMicrochip(final long groupItems, final long genId) {
  //   final long mcId = genId >> generatorShift;
  //   return (groupItems & mcId) != 0;
  // }

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

}
