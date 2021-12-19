// Navigation Bar SECTION
const navBar = {
  show: true,
};

// Main Body SECTION
const mainBody = {
  gradientColors: "#4484ce, #1ad7c0, #ff9b11, #9b59b6, #ff7f7f, #ecf0f1",
  firstName: "MinGyu",
  middleName: "",
  lastName: "Kim",
  message: " Passionate about learning new things ",
  icons: [
    {
      image: "fab fa-github",
      url: "https://github.com/kmg733",
    },
    {
      image: "fab fa-blogger-b",
      url: "https://blog.naver.com/mang906",
    },
  ],
};

// ABOUT SECTION
// If you want the About Section to show a profile picture you can fill the profilePictureLink either with:
//a) your Instagram username
//      i.e:profilePictureLink:"johnDoe123",
//b) a link to an hosted image
//      i.e:profilePictureLink:"www.picturesonline.com/johnDoeFancyAvatar.jpg",
//c) image in "editable-stuff" directory and use require("") to import here,
//      i.e: profilePictureLink: require("../editable-stuff/hashirshoaeb.png"),
//d) If you do not want any picture to be displayed, just leave it empty :)
//      i.e: profilePictureLink: "",
// For Resume either provide link to your resume or import from "editable-stuff" directory
//     i.e resume: require("../editable-stuff/resume.pdf"),
//         resume: "https://docs.google.com/document/d/13_PWdhThMr6roxb-UFiJj4YAFOj8e_bv3Vx9UHQdyBQ/edit?usp=sharing",

const about = {
  show: true,
  heading: "About Me",
  imageLink: require("../editable-stuff/kmg733.png"),
  imageSize: 380,
  message:
    "My name is MinGyu Kim belog to Kongju National University. My major is Computer Science Engineering since 2016. I love coding. I try to learn various things. But I hope to learn more about coding. So, I'm studying coding hard again today. My goal is to be great Backend Server Developer. Thank you for visit my portfolio web site.",
  resume: "https://blog.naver.com/PostList.naver?blogId=mang906&from=postList&categoryNo=43",
};

// PROJECTS SECTION
// Setting up project lenght will automatically fetch your that number of recently updated projects, or you can set this field 0 to show none.
//      i.e: reposLength: 0,
// If you want to display specfic projects, add the repository names,
//      i.e ["repository-1", "repo-2"]
const repos = {
  show: true,
  heading: "",
  gitHubUsername: "kmg733", //i.e."johnDoe12Gh"
  reposLength: 0,
  specificRepos: ["CodingTest", "BoT", "IMCP", "lab_iot"],
};

// Leadership SECTION
const leadership = {
  show: false,
  heading: "Leadership",
  message:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Vitae auctor eu augue ut lectus arcu bibendum at varius. Libero justo laoreet sit amet cursus sit amet. Imperdiet dui accumsan sit amet nulla facilisi morbi. At auctor urna nunc id. Iaculis urna id volutpat lacus laoreet non curabitur gravida. Et magnis dis parturient montes nascetur ridiculus mus mauris. In nisl nisi scelerisque eu ultrices vitae auctor. Mattis nunc sed blandit libero volutpat sed cras ornare. Pulvinar neque laoreet suspendisse interdum consectetur libero.",
  images: [
    { 
      img: require("../editable-stuff/kmg733.png"), 
      label: "First slide label", 
      paragraph: "Nulla vitae elit libero, a pharetra augue mollis interdum." 
    },
    { 
      img: require("../editable-stuff/kmg733.png"), 
      label: "Second slide label", 
      paragraph: "Nulla vitae elit libero, a pharetra augue mollis interdum." 
    },
  ],
  imageSize: {
    width:"615",
    height:"450"
  }
};

// SKILLS SECTION
const skills = {
  show: true,
  heading: "Skills",
  hardSkills: [
    { name: "Java", value: 67 },
    { name: "Python", value: 63 },
    { name: "MYSQL", value: 57 },
    { name: "MariaDB", value: 60 },
    { name: "C/C++", value: 45 },
    { name: "JavaScript", value: 55 },
    { name: "React", value: 38 },
    { name: "HTML/CSS", value: 33 },
  ],
  softSkills: [
    { name: "Goal-Oriented", value: 70 },
    { name: "Collaboration", value: 80 },
    { name: "Positivity", value: 90 },
    { name: "Adaptability", value: 75 },
    { name: "Problem Solving", value: 65 },
    { name: "Empathy", value: 65 },
    { name: "Organization", value: 80 },
    { name: "Creativity", value: 55 },
  ],
};

// GET IN TOUCH SECTION
const getInTouch = {
  show: true,
  heading: "Get In Touch",
  message:
    "If you have any questions, or if you just want to say hi, please feel free to email me at",
  email: "mang906@naver.com",
};

const experiences = {
  show: false,
  heading: "Experiences",
  data: [
    {
      role: 'Software Engineer',// Here Add Company Name
      companylogo: require('../assets/img/dell.png'),
      date: 'June 2018 – Present',
    },
    {
      role: 'Front-End Developer',
      companylogo: require('../assets/img/boeing.png'),
      date: 'May 2017 – May 2018',
    },
  ]
}

// Blog SECTION
// const blog = {
//   show: false,
// };

export { navBar, mainBody, about, repos, skills, leadership, getInTouch, experiences };
