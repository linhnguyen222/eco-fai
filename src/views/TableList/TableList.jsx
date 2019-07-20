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
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
// core components
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import Table from "components/Table/Table.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import data from "./dump.jsx";

const styles = {
  cardCategoryWhite: {
    "&,& a,& a:hover,& a:focus": {
      color: "rgba(255,255,255,.62)",
      margin: "0",
      fontSize: "14px",
      marginTop: "0",
      marginBottom: "0"
    },
    "& a,& a:hover,& a:focus": {
      color: "#FFFFFF"
    }
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
    "& small": {
      color: "#777",
      fontSize: "65%",
      fontWeight: "400",
      lineHeight: "1"
    }
  }
};

function TableList(props) {
  const { classes, match } = props;
  const slug = match.params.slug;
  const [destinationInfoState, setDestinationInfoState] = React.useState(
    "NOT_FETCHED"
  );
  const [costTable, setCostTable] = React.useState({});
  const [emissionTable, setEmissionTable] = React.useState({});
  const [additionalInfoTable, setadditionalInfoTable] = React.useState({});
  console.log("meow", data);
  if (destinationInfoState === "NOT_FETCHED") {
    setDestinationInfoState("WAITING");
    fetch(`/api/conference-registrants/${slug}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === "err") {
          setDestinationInfoState(res.error.code);
        } else {
          setDestinationInfoState("FETCHED");
          setCostTable({});
          setEmissionTable({});
          setadditionalInfoTable({});
        }
      });
    // .catch(err => {
    //   alert("Opps Something went wrong");
    //   throw err;
    // });
  }
  return (
    <div>
      {destinationInfoState === "FETCHED" ? (
        <GridContainer>
          <GridItem xs={12} sm={6} md={6}>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>Costs efficiency</h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by travel expense
                </p>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Destination City", "Cost in USD"]}
                  tableData={costTable}
                />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={6}>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>Costs efficiency</h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by CO2 emission efficiency
                </p>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Destination City", "CO emission"]}
                  tableData={emissionTable}
                />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={12}>
            <Card plain>
              <CardHeader plain color="info">
                <h4 className={classes.cardTitleWhite}>
                  Additional infomation
                </h4>
                <p className={classes.cardCategoryWhite}>
                  Additional infomation on destinations
                </p>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={[
                    "Departure",
                    "Destination",
                    "Cost in USD",
                    "Emission"
                  ]}
                  tableData={additionalInfoTable}
                />
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      ) : (
        <GridContainer>
          <GridItem xs={12} sm={6} md={6}>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>Costs efficiency</h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by travel expense
                </p>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Destination City", "Cost in USD"]}
                  tableData={[
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"]
                  ]}
                />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={6} md={6}>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>Costs efficiency</h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by CO2 emission efficiency
                </p>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Destination City", "CO emission"]}
                  tableData={[
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"],
                    ["Amsterdam", "36,738"]
                  ]}
                />
              </CardBody>
            </Card>
          </GridItem>
          <GridItem xs={12} sm={12} md={12}>
            <Card plain>
              <CardHeader plain color="info">
                <h4 className={classes.cardTitleWhite}>
                  Additional infomation
                </h4>
                <p className={classes.cardCategoryWhite}>
                  Additional infomation on destinations
                </p>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={[
                    "Departure",
                    "Destination",
                    "Cost in USD",
                    "Emission"
                  ]}
                  tableData={[
                    ["Amsterdam", "Paris", "123.21", "100"],
                    ["Helsinki", "Paris", "123.21", "100"],
                    ["Amsterdam", "Berlin", "123.21", "100"],
                    ["London", "Paris", "123.21", "100"],
                    ["Stockholm", "Berlin", "123.21", "100"]
                  ]}
                />
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      )}
    </div>
  );
}

// helper functions to filter table data
function _getCostTable(data) {
}
TableList.propTypes = {
  classes: PropTypes.object,
  match: PropTypes.object
};

export default withStyles(styles)(TableList);
