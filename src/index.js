const puppeteer = require("puppeteer");

const { EMAIL, PASSWORD } = require("../credentials.json");

const LOGIN_URL = "https://www.goodlifefitness.com/Goodlifelogin.html";
const BOOK_WORKOUT_URL =
  "https://www.goodlifefitness.com/book-workout.html#no-redirect";

const login = async (page) => {
  await page.goto(LOGIN_URL, {
    waitUntil: "networkidle0",
  });

  console.log("Logging in...");

  // Click email form
  await page.click(
    "#main-content > div > div > div > div.c-login-block__wrapper > form > div.c-field.js-login-email-field > label > input"
  );

  // Input email form
  await page.keyboard.type(EMAIL);

  // Click password form
  await page.click(
    "#main-content > div > div > div > div.c-login-block__wrapper > form > div.c-field.js-login-password-field > label > input"
  );

  // Input password form
  await page.keyboard.type(PASSWORD);

  // Press login button to submit form
  await page.click(
    'button[class="c-btn-cta c-btn-cta--chevron js-login-submit"]'
  );
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  console.log("Login Successful");
};

const bookWorkout = async (workoutsPage) => {
  await workoutsPage.waitForTimeout(2000);

  await workoutsPage.focus(
    "#js-classes-schedule > div:nth-child(4) > ul > li > div > button"
  );
  // Click on calendar button
  await workoutsPage.click(
    "#js-classes-schedule > div:nth-child(4) > ul > li > div > button"
  );

  await workoutsPage.waitForSelector(
    "#js-class-schedule-weekdays-container > li:nth-child(7)",
    { visible: true }
  );

  // Go 7 days ahead
  await workoutsPage.click(
    "#js-class-schedule-weekdays-container > li:nth-child(7)"
  );

  const todaysDate = new Date();

  // If the current day is sunday (0) or monday (1) book for saturday morning or sunday morning respectively
  const bookWeekendSession =
    todaysDate.getDay() == 0 || todaysDate.getDay() == 1;

  if (bookWeekendSession) {
    // Click on 1st time (7:00 AM) on weekend
    await workoutsPage.click(
      "#day-number-7 > li:nth-child(1) > div.col-md-12.col-lg-10 > div > div.col-4.c-schedule-calendar__cta-container > div.js-class-action-container > button"
    );
  } else {
    // Click on 2nd time (6:00 AM) on weekday
    await workoutsPage.click(
      "#day-number-7 > li:nth-child(2) > div.col-md-12.col-lg-10 > div > div.col-4.c-schedule-calendar__cta-container > div.js-class-action-container > button"
    );
  }

  // Wait for modal to be visible
  await workoutsPage.waitForSelector(
    "#js-classes-schedule > div:nth-child(4) > div.c-modal.c-schedule-calendar__class-details-modal.js-class-modal.u-transition-visible",
    { visible: true }
  );

  // Click on 'I agree with goodlife standards' select
  await workoutsPage.click("#js-workout-booking-agreement-input");

  // Click confirm button
  await workoutsPage.click(
    "#class-modal-container > div.c-modal__footer.js-class-action-container.js-class-api-message-container > div > button.c-btn-cta.c-btn-cta--chevron.modal-class-action.js-terms-agreement-cta"
  );

  // Wait some time for request to be made (Maybe not needed). Also wait for confirmed message that has a cancel button.
  await workoutsPage.waitForTimeout(1000 * 6);
  await workoutsPage.waitForSelector(
    "#js-classes-schedule > div:nth-child(4) > div.c-modal.c-schedule-calendar__class-details-modal.js-class-modal.u-transition-visible > div > div.modal-submition-close.js-class-action-modal-submition-close.u-is-block > button"
  );

  console.log("Workout Time Booked!");
};

const main = async () => {
  if (!EMAIL || !PASSWORD) {
    throw new Error("EMAIL and PASSWORD must be set in credentials.json file");
  }

  const browser = await puppeteer.launch({ headless: false });

  try {
    // Set geolocation details
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(
      "https://www.goodlifefitness.com/member-details.html",
      ["geolocation"]
    );

    const page = await browser.newPage();

    page.setDefaultTimeout(1000 * 120); // 120 second timeout, login wait times at midnight can take some time...

    await login(page);

    // Go to book workout page
    await page.goto(BOOK_WORKOUT_URL, { waitUntil: "networkidle0" });

    await bookWorkout(page);
  } catch (err) {
    console.error(err);
  }

  await browser.close();
};

main();
