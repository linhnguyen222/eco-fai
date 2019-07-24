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
import { makeStyles } from "@material-ui/core/styles";
// core components
import CircularProgress from "@material-ui/core/CircularProgress";
import TableFooter from "@material-ui/core/TableFooter";
import { Slider } from "material-ui-slider";
import GridItem from "components/Grid/GridItem.jsx";
import GridContainer from "components/Grid/GridContainer.jsx";
import Table from "components/Table/Table.jsx";
import Card from "components/Card/Card.jsx";
import CardHeader from "components/Card/CardHeader.jsx";
import CardBody from "components/Card/CardBody.jsx";
import EnterConferenceSlug from "components/EnterConferenceSlug/EnterConferenceSlug.jsx";
import CardAvatar from "components/Card/CardAvatar.jsx";
import avatar from "assets/img/cities/Copenhagen.png";

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
  },
  avatarStyle: {
    marginTop: "7px"
  },
  bestChoice: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "20px"
  },
  ceSlider: {
    marginTop: "10px"
  }
};

const useStyles = makeStyles(theme => ({
  progress: {
    margin: theme.spacing(2)
  }
}));

function TableList(props) {
  const { classes, match, history } = props;
  const { progress } = useStyles();
  const slug = match.params.slug;
  const [destinationInfoState, setDestinationInfoState] = React.useState(
    "NOT_FETCHED"
  );
  const [costEmissionTable, setCostEmissionTable] = React.useState([[""]]);
  const [
    costEmissionWeightedTable,
    setCostEmissionWeightedTable
  ] = React.useState([[""]]);
  const [ceRange, setCeRange] = React.useState(0);
  const [tableData, setTableData] = React.useState([[""]]);
  const [
    currentlyFetchingFlightPlans,
    setCurrentlyFetchingFlightPlans
  ] = React.useState(0);
  const [
    currentlyFetchingFlightPlansState,
    setCurrentlyFetchingFlightPlansState
  ] = React.useState("NOT_FETCHED");

  function fetchCurrentlyFetchingFlightPlans(slug) {
    setCurrentlyFetchingFlightPlansState("WAITING");
    fetch(`/api/fetching-flight-plans/${slug}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === "ok") {
          setCurrentlyFetchingFlightPlans(res.info.fetching);
          setCurrentlyFetchingFlightPlansState("FETCHED");
        }
      });
  }

  function fetchAndComputeTableData(slug) {
    setDestinationInfoState("WAITING");
    fetch(`/api/conference-interest/${slug}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === "err") {
          // alert(
          //   "Opps! Something went wrong, can you check your conference slug in the url"
          // );
          setDestinationInfoState(res.error.code);
          // show the dummy table
          const dumpCostEmission = _formatTableData(
            _getCostEmissionsTable(tableData)
          );
          setCostEmissionTable(dumpCostEmission);
          // show dummny weighted table
          const dumpWeighted = _formatTableData(
            _getCostEmissionByRange(tableData, ceRange)
          );
          setCostEmissionWeightedTable(dumpWeighted);
        } else {
          setDestinationInfoState("FETCHED");
          // set table Data
          setTableData(res);
          // costEmissionTable
          const costEmission = _formatTableData(_getCostEmissionsTable(res));
          setCostEmissionTable(costEmission);
          // weighted cost emission table
          const weighted = _formatTableData(
            _getCostEmissionByRange(res, ceRange)
          );
          setCostEmissionWeightedTable(weighted);
        }
      })
      .catch(e => console.error(e));
  }

  function navigateToSlug(slug) {
    history.push(`/admin/destinations/${slug}`);
    fetchAndComputeTableData(slug);
    fetchCurrentlyFetchingFlightPlans(slug);
  }

  if (currentlyFetchingFlightPlansState === "NOT_FETCHED") {
    fetchCurrentlyFetchingFlightPlans(slug);
  }

  if (destinationInfoState === "NOT_FETCHED") {
    fetchAndComputeTableData(slug);
  }
  function handleRangeChange(value) {
    const range = Number(value);
    setCeRange(range);
    const weighted = _formatTableData(
      _getCostEmissionByRange(tableData, range)
    );
    setCostEmissionWeightedTable(weighted);
  }
  function addDefaultImgSrc(event) {
    event.target.src = avatar;
  }
  return (
    <div>
      {slug === ":slug" ? (
        <EnterConferenceSlug
          classes={classes}
          navigateToConferenceSlug={navigateToSlug}
        />
      ) : destinationInfoState === "FETCHED" ? (
        <GridContainer>
          <GridItem xs={12} sm={12} md={12}>
            {costEmissionWeightedTable.length !== 0 ? (
              <Card>
                <CardHeader color="info">
                  <h4 className={classes.cardTitleWhite}>
                    Cost and Emissions Tradeoff
                  </h4>
                  <p className={classes.cardCategoryWhite}>
                    Destinations ranked by best possible travel expense for
                    desired efficiency
                  </p>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    {/* sidebar info */}
                    <GridItem xs={12} sm={12} md={6}>
                      <CardAvatar profile className={classes.avatarStyle}>
                        <a
                          href="#cophenhagen"
                          onClick={e => e.preventDefault()}
                        >
                          {/* <img id="destination-img" src={"https://thumbor.forbes.com/thumbor/711x490/https://specials-images.forbesimg.com/dam/imageserve/1128749011/960x0.jpg?fit=scale"} alt="..." /> */}
                          <img
                            onError={addDefaultImgSrc}
                            className="img-responsive"
                            src={
                              "https://ecofai-images.s3.eu-north-1.amazonaws.com/" +
                              costEmissionWeightedTable[0][0] +
                              "-min.png"
                            }
                          />
                        </a>
                      </CardAvatar>
                      <div className={classes.bestChoice}>
                        <h4>Best Choice: {costEmissionWeightedTable[0][0]}</h4>
                        <GridContainer>
                          <GridItem sm={3}>
                            <p>Emissions</p>
                          </GridItem>
                          <GridItem sm={6}>
                            <Slider
                              min={1}
                              max={10}
                              value={ceRange}
                              onChange={handleRangeChange}
                            />
                          </GridItem>
                          <GridItem sm={3}>
                            <p>Cost</p>
                          </GridItem>
                        </GridContainer>
                      </div>
                    </GridItem>
                    {/* end of sidebar info */}
                    {/* The table */}
                    <GridItem xs={12} sm={12} md={5}>
                      {destinationInfoState === "FETCHED" ? (
                        <Table
                          tableHeaderColor="primary"
                          tableHead={[
                            "Host City",
                            "Emissions CO2/m3",
                            "Cost (USD $)"
                          ]}
                          tableData={costEmissionWeightedTable}
                        >
                          {currentlyFetchingFlightPlansState === "FETCHED" ? (
                            currentlyFetchingFlightPlans ? (
                              <TableFooter>
                                <GridContainer>
                                  <GridItem sm={3}>
                                    <CircularProgress className={progress} />
                                  </GridItem>
                                  <GridItem sm={9}>
                                    <p>
                                      Working on {currentlyFetchingFlightPlans}{" "}
                                      flight plans
                                    </p>
                                  </GridItem>
                                </GridContainer>
                              </TableFooter>
                            ) : null
                          ) : (
                            <span />
                          )}
                        </Table>
                      ) : (
                        <CircularProgress className={progress} />
                      )}
                    </GridItem>
                  </GridContainer>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <h4 className={classes.cardTitleWhite}>
                    No Participants yet!
                  </h4>
                </CardHeader>
                <CardBody>
                  <GridContainer>
                    <GridItem xs={12} sm={12} md={3}>
                      <CircularProgress className={progress} />
                    </GridItem>
                    <GridItem>
                      <p>
                        Your conference does not have any participants yet, come
                        back once they have registered!
                      </p>
                      <p>
                        If you just registered a participant, note that
                        computing their optimal path may take a few minutes, so
                        check back in a bit
                      </p>
                    </GridItem>
                  </GridContainer>
                </CardBody>
              </Card>
            )}
          </GridItem>
          <GridItem xs={12} sm={12} md={12}>
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
                {destinationInfoState === "FETCHED" ? (
                  <Table
                    tableHeaderColor="primary"
                    tableHead={[
                      "Destination City",
                      "Max Cost (USD)",
                      "Max Cost Emissions CO2/m3",
                      "Min Cost (USD)",
                      "Min Cost Emissions CO2/m3"
                    ]}
                    tableData={costEmissionTable}
                  >
                    {currentlyFetchingFlightPlansState === "FETCHED" ? (
                      currentlyFetchingFlightPlans ? (
                        <TableFooter>
                          <GridContainer>
                            <GridItem sm={3}>
                              <CircularProgress className={progress} />
                            </GridItem>
                            <GridItem sm={9}>
                              <p>
                                Working on {currentlyFetchingFlightPlans} flight
                                plans
                              </p>
                            </GridItem>
                          </GridContainer>
                        </TableFooter>
                      ) : null
                    ) : (
                      <span />
                    )}
                  </Table>
                ) : (
                  <CircularProgress className={progress} />
                )}
              </CardBody>
            </Card>
          </GridItem>
        </GridContainer>
      ) : (
        // default offline page
        <GridContainer>
          {/* first table */}
          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>
                  Cost and Emissions Tradeoff
                </h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by travel expense (This is a dummy table)
                </p>
              </CardHeader>
              <CardBody>
                <p>Set our priorities</p>
                <div className={classes.bestChoice}>
                  <h4>Best Choice: {costEmissionWeightedTable[0][0]}</h4>
                  <GridContainer>
                    <GridItem sm={3}>
                      <p>Emissions</p>
                    </GridItem>
                    <GridItem sm={6}>
                      <Slider
                        min={1}
                        max={10}
                        value={ceRange}
                        onChange={handleRangeChange}
                      />
                    </GridItem>
                    <GridItem sm={3}>
                      <p>Cost</p>
                    </GridItem>
                  </GridContainer>
                </div>
                {destinationInfoState === "FETCHED" ? (
                  <Table
                    tableHeaderColor="primary"
                    tableHead={["Host City", "Emissions", "Cost"]}
                    tableData={costEmissionWeightedTable}
                  />
                ) : (
                  <CircularProgress className={progress} />
                )}
              </CardBody>
            </Card>
          </GridItem>
          {/* second table */}
          <GridItem xs={12} sm={12} md={12}>
            <Card>
              <CardHeader color="info">
                <h4 className={classes.cardTitleWhite}>
                  Cost Emission efficiency
                </h4>
                <p className={classes.cardCategoryWhite}>
                  Destinations ranked by travel expense (This is a dummy table)
                </p>
              </CardHeader>
              <CardBody>
                {destinationInfoState === "FETCHED" ? (
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
                ) : (
                  <CircularProgress className={progress} />
                )}
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
  const costEmissionTable = _getCostEmissionsTable(data);
  const ceDiffTable = costEmissionTable.map(value => {
    let obj = {
      destination: value.destination,
      eMin: value.maxCostEmissions,
      cMax: value.maxCost, //eMin has cMax
      eDiff: value.minCostEmissions - value.maxCostEmissions,
      cDiff: value.maxCost - value.minCost
    };
    return obj;
  });
  let costEmissionWeightedTable = ceDiffTable.map(value => {
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
  match: PropTypes.object,
  history: PropTypes.object
};

export default withStyles(styles)(TableList);
