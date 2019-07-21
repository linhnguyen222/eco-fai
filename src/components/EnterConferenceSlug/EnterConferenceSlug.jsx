import React from "react";
import PropTypes from "prop-types";

import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";

const EnterConferenceSlug = ({ classes }) => {
  return (
    <GridContainer>
      <Card>
        <CardHeader color="warning">
          <h3 className={classes.cardTitleWhite}>
            No Conference slug in the url
          </h3>
        </CardHeader>
        <h4 style={{ padding: "30px" }}>
          You need to put in your conference slug in order to register to a
          conference, replace `:slug` in the url with your conference slug
        </h4>
      </Card>
    </GridContainer>
  );
};

EnterConferenceSlug.propTypes = {
  classes: PropTypes.object.isRequired
};

export default EnterConferenceSlug;
