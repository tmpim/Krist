/*
 * Copyright 2016 - 2024 Drew Edwards, tmpim
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/tmpim/krist>.
 */

export function getLegacyWork(id: number): number | null {
  // Early return for all existing blocks
  if (id >= 5000) return null;

  if (id >= 1 && id < 501) return 400000000000;
  if (id >= 501 && id < 541) return 381274937337;
  if (id >= 541 && id < 546) return 350000000000;
  if (id >= 546 && id < 549) return 400000000000;
  if (id >= 549 && id < 554) return 300000000000;
  if (id >= 554 && id < 635) return 288365888229;
  if (id >= 635 && id < 891) return 58365888229;
  if (id >= 891 && id < 936) return 6000000000;
  if (id >= 936 && id < 974) return 400000000000;
  if (id >= 974 && id < 979) return 100000000000;
  if (id >= 979 && id < 1083) return 400000000000;
  if (id >= 1083 && id < 1149) return 100000000000;
  if (id >= 1149 && id < 1165) return 10000000000;
  if (id >= 1165 && id < 1171) return 5000000000;
  if (id >= 1171 && id < 1172) return 500000000;
  if (id >= 1172 && id < 1178) return 5000000000;
  if (id >= 1178 && id < 1355) return 2000000000000;
  if (id >= 1355 && id < 1390) return 200000000000;
  if (id >= 1390 && id < 2486) return 20000000000;
  if (id >= 2486 && id < 2640) return 400000000000;
  if (id >= 2640 && id < 2667) return 300000000000;
  if (id >= 2667 && id < 2700) return 3000000000;
  if (id >= 2700 && id < 2743) return 10000000000;
  if (id >= 2743 && id < 2773) return 8000000000;
  if (id >= 2773 && id < 2795) return 5000000000;
  if (id >= 2795 && id < 2812) return 3000000000;
  if (id >= 2812 && id < 2813) return 1000000000;
  if (id >= 2813 && id < 2936) return 400000000000;
  if (id >= 2936 && id < 2942) return 4000000000;
  if (id >= 2942 && id < 2972) return 8000000000;
  if (id >= 2972 && id < 2989) return 2000000000;
  if (id >= 2989 && id < 2990) return 100000000;
  if (id >= 2990 && id < 2998) return 500000000;
  if (id >= 2998 && id < 3000) return 200000000;
  if (id >= 3000 && id < 3003) return 100000000;
  if (id >= 3003 && id < 3005) return 50000000;
  if (id >= 3005 && id < 3006) return 23555120;
  if (id >= 3006 && id < 3018) return 53555120;
  if (id >= 3018 && id < 3029) return 20000000;
  if (id >= 3029 && id < 3089) return 400000000000;
  if (id >= 3089 && id < 3096) return 20000000;
  if (id >= 3096 && id < 3368) return 19875024;
  if (id >= 3368 && id < 4097) return 10875024;
  if (id >= 4097 && id < 5000) return 8750240;

  return null;
}
