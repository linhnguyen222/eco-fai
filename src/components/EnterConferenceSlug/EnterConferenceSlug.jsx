import React from "react";
import PropTypes from "prop-types";

import Button from "components/CustomButtons/Button.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import withStyles from "@material-ui/core/styles/withStyles";
import GridContainer from "components/Grid/GridContainer.jsx";

const styles = {
  conferenceCodeInput: {
    margin: "4px 0 0 0"
  }
};

const EnterConferenceSlug = ({ classes, navigateToConferenceSlug }) => {
  let [code, setCode] = React.useState("");
  let [codeError, setCodeError] = React.useState("");

  function handleNameChange(event) {
    setCode(event.target.value);
    setCodeError("");
  }

  function handleCheckConference() {
    fetch(`/api/conference-exists/${code}`)
      .then(r => r.json())
      .then(r => {
        if (r.error) {
          setCodeError(r.error.msg);
        } else {
          navigateToConferenceSlug(code);
        }
      });
  }

  return (
    <GridContainer>
      <Card>
        <CardHeader color="warning">
          <h3 className={classes.cardTitleWhite}>Conference Code Required</h3>
        </CardHeader>
        <h4 style={{ padding: "30px" }}>
          Enter your conference code to see this page
        </h4>
        <GridItem xs={12} sm={12} md={12}>
          <GridContainer>
            <GridItem xs={12} sm={12} md={8}>
              <CustomInput
                className={classes.conferenceCodeInput}
                labelText={codeError || "Conference Code"}
                id="name"
                formControlProps={{
                  fullWidth: true
                }}
                inputProps={{
                  value: code,
                  onChange: handleNameChange,
                  error: !!codeError
                }}
              />
            </GridItem>
            <GridItem xs={12} sm={12} md={4}>
              <Button
                style={{ marginTop: "30px" }}
                color="primary"
                disabled={!code}
                onClick={handleCheckConference}
              >
                Continue
              </Button>
            </GridItem>
          </GridContainer>
        </GridItem>
      </Card>
    </GridContainer>
  );
};

EnterConferenceSlug.propTypes = {
  classes: PropTypes.object.isRequired,
  navigateToConferenceSlug: PropTypes.func.isRequired
};

export default withStyles(styles)(EnterConferenceSlug);
