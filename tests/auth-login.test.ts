import assert from "node:assert/strict";
import { loginAccountCandidates } from "../lib/auth";

assert.deepEqual(loginAccountCandidates("admin"), ["admin", "admin@mifaso.com"]);
assert.deepEqual(loginAccountCandidates(" admin@mifaso.com "), ["admin@mifaso.com"]);
assert.deepEqual(loginAccountCandidates("jason"), ["jason"]);
