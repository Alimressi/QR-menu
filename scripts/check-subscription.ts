import {
  getEffectiveStatus,
  getTrialDaysLeft,
  isRestaurantServable,
  parseSubscriptionInput,
} from "@/lib/subscription";

let failures = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${name}`);
  }
}

const day = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(Date.now() + n * day);

console.log("effective status");
check("active stays active", getEffectiveStatus({ status: "active" }) === "active");
check("disabled stays disabled", getEffectiveStatus({ status: "disabled" }) === "disabled");
check("past_due stays past_due", getEffectiveStatus({ status: "past_due" }) === "past_due");
check("trial with 5 days left is trial", getEffectiveStatus({ status: "trial", trialEndsAt: inDays(5) }) === "trial");
check(
  "trial that ended yesterday becomes past_due on its own",
  getEffectiveStatus({ status: "trial", trialEndsAt: inDays(-1) }) === "past_due",
);
check("trial with no end date never lapses", getEffectiveStatus({ status: "trial" }) === "trial");

console.log("\nfailing safe");
check("unknown status is treated as active", getEffectiveStatus({ status: "weird" }) === "active");
check("null status is treated as active", getEffectiveStatus({ status: null }) === "active");
check("missing status is treated as active", getEffectiveStatus({}) === "active");
check(
  "unparseable trial date does not take the menu down",
  getEffectiveStatus({ status: "trial", trialEndsAt: "not-a-date" }) === "trial",
);

console.log("\nwho gets served");
check("active is served", isRestaurantServable({ status: "active" }));
check("live trial is served", isRestaurantServable({ status: "trial", trialEndsAt: inDays(3) }));
check("lapsed trial is not served", !isRestaurantServable({ status: "trial", trialEndsAt: inDays(-1) }));
check("past_due is not served", !isRestaurantServable({ status: "past_due" }));
check("disabled is not served", !isRestaurantServable({ status: "disabled" }));

console.log("\ntrial countdown");
check("7 days out reads as 7", getTrialDaysLeft({ status: "trial", trialEndsAt: inDays(7) }) === 7);
check("lapsed reads negative", (getTrialDaysLeft({ status: "trial", trialEndsAt: inDays(-2) }) ?? 0) < 0);
check("not on a trial reads null", getTrialDaysLeft({ status: "active", trialEndsAt: inDays(7) }) === null);

console.log("\nrequest parsing");
check("absent keys stay absent (a PATCH cannot wipe them)", Object.keys(parseSubscriptionInput({})).length === 0);
check("valid status is kept", parseSubscriptionInput({ status: "disabled" }).status === "disabled");
check("bogus status is dropped, not stored", parseSubscriptionInput({ status: "bogus" }).status === undefined);
check("empty date string clears the field", parseSubscriptionInput({ trialEndsAt: "" }).trialEndsAt === null);
check("explicit null clears the field", parseSubscriptionInput({ trialEndsAt: null }).trialEndsAt === null);
check(
  "a date string is parsed",
  parseSubscriptionInput({ trialEndsAt: "2026-09-01" }).trialEndsAt instanceof Date,
);
check("garbage date is ignored", parseSubscriptionInput({ trialEndsAt: "nope" }).trialEndsAt === undefined);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
