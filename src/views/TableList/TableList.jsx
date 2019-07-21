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
  const [costEmissionTable, setCostEmissionTable] = React.useState([[""]]);
  const [
    costEmissionWeightedTable,
    setCostEmissionWeightedTable
  ] = React.useState([[""]]);

  const [tableData, setTableData] = React.useState(data);
  if (destinationInfoState === "NOT_FETCHED") {
    setDestinationInfoState("WAITING");
    fetch(`/api/conference-interest/${slug}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === "err") {
          setDestinationInfoState(res.error.code);
          // show the dummy table
          const dumpCostEmission = _formatTableData(
            _getCostEmissionsTable(tableData)
          );
          setCostEmissionTable(dumpCostEmission);
          // show dummny weighted table
          const dumpWeighted = _formatTableData(
            _getCostEmissionByRange(tableData, 1)
          );
          setCostEmissionWeightedTable(dumpWeighted);
        } else {
          setDestinationInfoState("FETCHED");
          // set table Data
          setTableData(res);
          // costEmissionTable
          const costEmission = _formatTableData(
            _getCostEmissionsTable(tableData)
          );
          setCostEmissionTable(costEmission);
          // weighted cost emission table
          const weighted = _formatTableData(
            _getCostEmissionByRange(tableData, 1)
          );
          setCostEmissionWeightedTable(weighted);
        }
      })
      .catch(err => {
        alert("Opps Something went wrong");
        const dumpCostEmission = _formatTableData(
          _getCostEmissionsTable(tableData)
        );
        setCostEmissionTable(dumpCostEmission);

        // show dummny weighted table
        const dumpWeighted = _formatTableData(
          _getCostEmissionByRange(tableData, 1)
        );
        setCostEmissionWeightedTable(dumpWeighted);
        throw err;
      });
  }
  function handleRangeChange(event) {
    const range = Number(event.target.value);
    const weighted = _formatTableData(
      _getCostEmissionByRange(tableData, range)
    );
    setCostEmissionWeightedTable(weighted);
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
                  tableHead={[
                    "Destination City",
                    "Max Cost",
                    "Max Cost Emissions",
                    "Min Cost",
                    "Min Cost Emissions"
                  ]}
                  tableData={costEmissionTable}
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
              {/* <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Destination City", "CO emission"]}
                  tableData={emissionTable}
                />
              </CardBody> */}
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
              {/* <CardBody>
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
              </CardBody> */}
            </Card>
          </GridItem>
        </GridContainer>
      ) : (
        // default offline page
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>
                  Test input bar akdfalskfdnalskd
                </h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by travel expense
                </p>
              </CardHeader>
              <CardBody>
                Emissions
                <input
                  type="range"
                  name="emissionRange"
                  min="1"
                  max="10"
                  onChange={handleRangeChange}
                ></input>
                Cost
                <Table
                  tableHeaderColor="primary"
                  tableHead={["Destination City", "Emissions", "Cost"]}
                  tableData={costEmissionWeightedTable}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>
                  Cost Emission efficiency
                </h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by travel expense
                </p>
              </CardHeader>
              <CardBody>
                <Table
                  tableHeaderColor="primary"
                  tableHead={[
                    "Destination City",
                    "Max Cost",
                    "Max Cost Emissions",
                    "Min Cost",
                    "Min Cost Emissions"
                  ]}
                  tableData={costEmissionTable}
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
function _getCostEmissionsTable(data) {
  var allDestinationFrontier = data.info.destinationOptimality.flatMap(
    dest => dest.destinationFrontier
  );
  var costEmisDestinationTable = allDestinationFrontier.reduce((arr, df) => {
    if (df && df.destination && df.tradeoff[0]) {
      let ele = arr.find(ele => ele.destination === df.destination);
      if (!ele) {
        var obj = {
          destination: df.destination,
          maxCost: df.tradeoff[0].price,
          maxCostEmissions: df.tradeoff[0].emissions,
          minCost: df.tradeoff[df.tradeoff.length - 1].price,
          minCostEmissions: df.tradeoff[df.tradeoff.length - 1].emissions
        };
        arr.push(obj);
      } else {
        ele.maxCost = ele.maxCost + df.tradeoff[0].price;
        ele.maxCostEmissions = ele.maxCostEmissions + df.tradeoff[0].emissions;
        ele.minCost = ele.minCost + df.tradeoff[df.tradeoff.length - 1].price;
        ele.minCostEmissions =
          ele.minCostEmissions + df.tradeoff[df.tradeoff.length - 1].emissions;
      }
    }
    return arr;
  }, []);
  return costEmisDestinationTable;
}
function _getCostEmissionByRange(data, range) {
  let costEmissionTable = _getCostEmissionsTable(data);
  costEmissionTable = costEmissionTable.map(value => {
    let obj = {
      destination: value.destination,
      eMin: value.maxCostEmissions,
      cMax: value.maxCost, //eMin has cMax
      eDiff: value.minCostEmissions - value.maxCostEmissions,
      cDiff: value.maxCost - value.minCost
    };
    return obj;
  });
  let costEmissionWeightedTable = costEmissionTable.map(value => {
    let obj = {
      destination: value.destination,
      wEmissions: value.eMin + (value.eDiff * range) / 10,
      wCost: value.cMax - (value.cDiff * range) / 10
    };
    return obj;
  });
  // sort by cost if range >  5 and by emissions if <= 5
  if (range > 5) {
    costEmissionWeightedTable = costEmissionWeightedTable.sort((a, b) => {
      return a.wCost - b.wCost;
    });
  } else {
    costEmissionWeightedTable = costEmissionWeightedTable.sort((a, b) => {
      return a.wEmissions - b.wEmissions;
    });
  }
  return costEmissionWeightedTable;
}
function _formatTableData(data) {
  return data.map(function(obj) {
    return Object.keys(obj).map(function(key) {
      return obj[key];
    });
  });
}
TableList.propTypes = {
  classes: PropTypes.object,
  match: PropTypes.object
};

export default withStyles(styles)(TableList);
