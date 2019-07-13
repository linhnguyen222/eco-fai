/*!

=========================================================
* Material Dashboard React - v1.7.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// react-router imports
import { withRouter } from "react-router";
// date-io utils
import DateFnsUtils from "@date-io/date-fns";
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import FormControl from "@material-ui/core/FormControl";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from "@material-ui/pickers";
// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardAvatar from "components/Card/CardAvatar.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import CardFooter from "components/Card/CardFooter.jsx";

import avatar from "assets/img/faces/marc.jpg";

const styles = {
  cardCategoryWhite: {
    color: "rgba(255,255,255,.62)",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0"
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none"
  }
};

function RegisterForConference(props) {
  const { classes, match } = props;
  const slug = match.params.slug;

  const [startDate, setStartDate] = React.useState(Date.now());
  const [endDate, setEndDate] = React.useState(Date.now());
  const [conferenceInfoState, setConferenceInfoState] = React.useState(
    "NOT_FETCHED"
  );
  const [conferenceName, setConferenceName] = React.useState("");
  const [conferenceDescription, setConferenceDescription] = React.useState("");
  const [conferenceOrganizer, setConferenceOrganizer] = React.useState("");
  const [
    conferenceEarliestStartDate,
    setConferenceEarliestStartDate
  ] = React.useState(Date.now());
  const [conferenceLatestEndDate, setConferenceLatestEndDate] = React.useState(
    Date.now()
  );

  function handleStartDateChange(date) {
    setStartDate(date);
  }

  function handleEndDateChange(date) {
    setEndDate(date);
  }

  if (conferenceInfoState === "NOT_FETCHED") {
    setConferenceInfoState("WAITING");
    fetch(`/api/conference-proposal/${slug}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === "err") {
          setConferenceInfoState(res.error.code);
        } else {
          setConferenceInfoState("FETCHED");
          setConferenceName(res.info.conference.name);
          setConferenceDescription(res.info.conference.description);
          setConferenceOrganizer(res.info.conference.organizer);
          setConferenceName(res.info.conference.name);
          setConferenceEarliestStartDate(res.info.conference.earliestStartDate);
          setConferenceLatestEndDate(res.info.conference.latestEndDate);
          handleStartDateChange(res.info.conference.earliestStartDate);
          handleEndDateChange(res.info.conference.latestEndDate);
        }
      });
  }

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <GridContainer>
        <GridItem xs={12} sm={12} md={8}>
          <Card>
            <CardHeader color="primary">
              <h4 className={classes.cardTitleWhite}>
                Register your interest for{" "}
                {`${conferenceName ? conferenceName : "this conference"}`}
              </h4>
            </CardHeader>
            <CardBody profile={conferenceDescription}>
              <GridContainer>
                <GridItem xs={12} sm={12} md={12}>
                  <CustomInput
                    labelText="Travelling From"
                    id="from"
                    formControlProps={{
                      fullWidth: true
                    }}
                  />
                </GridItem>
              </GridContainer>
              <GridContainer>
                <GridItem xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <KeyboardDatePicker
                      id="start-date-picker"
                      label="Earliest Possible Start Date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      minDate={conferenceEarliestStartDate}
                      maxDate={conferenceLatestEndDate}
                      KeyboardButtonProps={{
                        "aria-label": "change earliest start date"
                      }}
                    />
                  </FormControl>
                </GridItem>
                <GridItem xs={12} sm={12} md={6}>
                  <FormControl fullWidth>
                    <KeyboardDatePicker
                      id="end-date-picker"
                      label="Latest Possible Possible End Date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      minDate={conferenceEarliestStartDate}
                      maxDate={conferenceLatestEndDate}
                      KeyboardButtonProps={{
                        "aria-label": "change latest end date"
                      }}
                    />
                  </FormControl>
                </GridItem>
              </GridContainer>
            </CardBody>
            <CardFooter>
              <Button color="primary">Register My Interest</Button>
            </CardFooter>
          </Card>
        </GridItem>
        {conferenceName.length &&
          conferenceDescription.length &&
          conferenceOrganizer.length && (
            <GridItem xs={12} sm={12} md={4}>
              <Card profile>
                <CardAvatar profile>
                  <a href="#pablo" onClick={e => e.preventDefault()}>
                    <img src={avatar} alt="..." />
                  </a>
                </CardAvatar>
                <CardBody profile>
                  <h6 className={classes.cardCategory}>
                    {conferenceOrganizer}
                  </h6>
                  <h4 className={classes.cardTitle}>{conferenceName}</h4>
                  <p className={classes.description}>{conferenceDescription}</p>
                  <Button color="primary" round>
                    Follow
                  </Button>
                </CardBody>
              </Card>
            </GridItem>
          )}
      </GridContainer>
    </MuiPickersUtilsProvider>
  );
}

RegisterForConference.propTypes = {
  classes: PropTypes.object
};

export default withRouter(withStyles(styles)(RegisterForConference));
