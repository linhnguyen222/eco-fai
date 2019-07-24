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
import {
  Provider,
  Heading,
  Subhead,
  Relative,
  Absolute,
  Image,
  NavLink,
  Flex,
  Box
} from "rebass";
import {
  Feature,
  CallToAction,
  ScrollDownIndicator,
  Section
} from "react-landing-page";

// react-router imports
import { withRouter } from "react-router";
// date-io utils
// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
// core components

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

const Hero = ({
  bg,
  backgroundImage,
  bgOpacity,
  style = {},
  imageStyle = {},
  children,
  ...props
}) => (
  <Relative>
    {backgroundImage && (
      <Absolute
        top={0}
        right={0}
        bottom={0}
        left={0}
        zIndex={-2}
        style={{ height: "100%" }}
      >
        <Image
          src={backgroundImage}
          alt=""
          width={1}
          style={{ height: "100%", objectFit: "cover", ...imageStyle }}
        />
      </Absolute>
    )}
    <Absolute
      top={0}
      right={0}
      bottom={0}
      left={0}
      zIndex={-1}
      bg={bg}
      style={{ opacity: backgroundImage ? bgOpacity : 1, height: "100%" }}
    />
    <Flex
      style={{
        minHeight: "100vh",
        ...style
      }}
      {...props}
    >
      {children}
    </Flex>
  </Relative>
);

Hero.displayName = "Hero";
Hero.defaultProps = {
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  bgOpacity: 0.9
};
Hero.propTypes = {
  bg: PropTypes.string,
  backgroundImage: PropTypes.string,
  bgOpacity: PropTypes.number,
  style: PropTypes.object,
  imageStyle: PropTypes.object,
  children: PropTypes.any
};

const NoPaddedSection = ({ children, style }) => (
  <Section style={{ padding: 0, ...style }}>{children}</Section>
);

NoPaddedSection.propTypes = {
  style: PropTypes.object,
  children: PropTypes.arrayOf(PropTypes.node)
};

const Footer = () => (
  <Flex is="footer" p={3}>
    <NavLink
      children="Product Hunt" // eslint-disable-line react/no-children-prop
      to="https://www.producthunt.com/posts/ecof-ai"
    />
    <NavLink
      children="GitHub" // eslint-disable-line react/no-children-prop
      href={"https://www.producthunt.com/linhngyuen222/eco-fai"}
    />
    <Box color="grey" ml="auto">
      Made with ♥️ for a better environment.
    </Box>
  </Flex>
);

function LandingPage() {
  return (
    <Provider>
      <Hero
        color="black"
        bg="white"
        backgroundImage="https://source.unsplash.com/1600x900/?airplane,airport,flying"
        imageStyle={{
          filter: "blur(0.1rem)"
        }}
      >
        <Heading>ecof.ai</Heading>
        <Subhead>
          Dont fly everyone halfway around the world for no reason!
        </Subhead>
        <CallToAction href="/admin/create" mt={3}>
          Create your conference
        </CallToAction>
        <ScrollDownIndicator />
      </Hero>
      <br />
      <Heading textAlign="center">How it works</Heading>
      <NoPaddedSection>
        <Flex flexWrap="wrap" justifyContent="center">
          <Feature
            icon="✏️"
            description="Tell us some rough locations and dates for your conference"
          >
            Create
          </Feature>
          <Feature icon="🙋‍♂️" description="Your users register their interest">
            Register
          </Feature>
          <Feature
            icon="🌏"
            description="We pick a place that saves the environment and your participants money!"
          >
            Ecofai it!
          </Feature>
        </Flex>
      </NoPaddedSection>
      <NoPaddedSection>
        <Heading textAlign="center">Why</Heading>
        <Flex flexWrap="wrap" justifyContent="center">
          <Box width={[1, 1, 1]}>
            Did you know that air travel makes up more than 2% of CO2 emissions
            worldwide?
          </Box>
        </Flex>
      </NoPaddedSection>
      <NoPaddedSection>
        <Flex flexWrap="wrap" justifyContent="center">
          <Box width={[1, 1, 3 / 4]}>
            Usually, when conferences are organized, the venue selection is done
            before the conference participants sign up. If your conference
            participants often come from elsewhere, this can lead to lots of
            unnecessary flying ✈️😭.
          </Box>
        </Flex>
      </NoPaddedSection>
      <NoPaddedSection>
        <Flex flexWrap="wrap" justifyContent="center">
          <Box width={[1, 1, 3 / 4]}>
            Instead, why not ask where your participants are coming from first
            using ecof.ai? Then we can tell you the most cost-effective and
            environmentally friendly place to host your conference!
          </Box>
        </Flex>
      </NoPaddedSection>
      <NoPaddedSection style={{ paddingBottom: 20 }}>
        <Flex justifyContent="center">
          <CallToAction href="/admin/create" mt={3}>
            Try it now for free!
          </CallToAction>
        </Flex>
      </NoPaddedSection>
      <Footer />
    </Provider>
  );
}

LandingPage.propTypes = {
  classes: PropTypes.object,
  match: PropTypes.object,
  history: PropTypes.object
};

export default withRouter(withStyles(styles)(LandingPage));
