import "./App.css";
import { useState, useEffect, useRef } from "react";
import {
  solveTSPNearest,
  solveTSPBruteForce,
  solveTSPMST,
} from "./routing_algorithms";
import { Bar } from "react-chartjs-2";
import { CategoryScale, Chart, LinearScale, BarElement } from "chart.js";
import { FormControl, FormLabel, Button, Input, Text } from "@chakra-ui/react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  Polyline,
} from "@react-google-maps/api";
import YourReactComponent from "./Landing";

const apiKey = "YOUR_API_KEY";

Chart.register(CategoryScale, LinearScale, BarElement);

const containerStyle = {
  width: "100%",
  height: "100%",
};

const center = {
  lat: 33.8704,
  lng: -117.9242,
};

// const smallPadding = {
//   padding: "10px 0px 10px 0px",
// }

// const smallMargin = {
//   margin: "10px 0px 10px 0px",
// }

const libraries = ["places"];

const OptimalDeliveryRouteSystem = () => {
  const [landingPage, setLandingPage] = useState(true);
  const [deliveryLocations, setDeliveryLocations] = useState([]);
  const [address, setAddress] = useState("");
  const [autocomplete, setAutocomplete] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [mapCenter, setMapCenter] = useState(center);
  const [isValidInput, setIsValidInput] = useState(true);
  const [cities, setCities] = useState([]);
  const [tourPath, setTourPath] = useState([]);
  var [totalDistance, setTotalDistance] = useState([]);
  const [directions, setDirections] = useState([]);
  const [markersWithLabels, setMarkersWithLabels] = useState([]);
  // const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [executionTimes, setExecutionTimes] = useState({
    "TSP Nearest": 0,
    "TSP Brute Force": 0,
    TSPMST: 0,
  });

  console.log(markersWithLabels);

  var tour = [];

  const selectAlgoRef = useRef();
  var selectedAlgo = null;
  const mapRef = useRef();

  useEffect(() => {
    if (markers.length > 0) {
      const latestMarker = markers[markers.length - 1];
      setMapCenter({ lat: latestMarker.lat, lng: latestMarker.lng });
    }
  }, [markers]);

  useEffect(() => {
    if (directions.length > 0 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      directions.forEach((point) => {
        bounds.extend(new window.google.maps.LatLng(point.lat(), point.lng()));
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [directions]);

  const handleAddLocation = (e) => {
    e.preventDefault();

    console.log(e.target.value)
    
    if (!isValidInput) {
      console.log("Invalid address");
      return; // Prevent adding invalid address to the list
    }

    const isInitialMarker = markers.length === 0; // Check if this is the first marker

    setDeliveryLocations([...deliveryLocations, address]);
    setAddress("");

    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      // console.log("Lat:", place.geometry.location.lat());
      // console.log("Lng:", place.geometry.location.lng());
      if (place && place.geometry && place.geometry.location) {
        const newMarkers = [
          ...markers,
          {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            isInitial: isInitialMarker,
          },
        ];
        setMarkers(newMarkers);

        const newCities = [
          ...cities,
          {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
        ];
        setCities(newCities);

        console.log("Cities:", newCities);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const handleSelectAlgorithm = () => {
      selectedAlgo = selectAlgoRef.current.value;
      setSelectedAlgorithm(selectedAlgo); 
    };

    const calculateDistances = async () => {
      const distances = [];
      const service = new window.google.maps.DistanceMatrixService();

      // Calculating distances between pairs of coordinates using Google Maps API
      for (let i = 0; i < cities.length; i++) {
        const origins = { lat: cities[i].lat, lng: cities[i].lng };
        const rowDistances = [];

        for (let j = 0; j < cities.length; j++) {
          if (i !== j) {
            const destination = { lat: cities[j].lat, lng: cities[j].lng };
            try {
              const distance = await calculateDistance(
                service,
                origins,
                destination
              );
              rowDistances.push(distance);
            } catch (error) {
              console.error(error);
              rowDistances.push(null); // Set distance as null if there's an error
            }
          } else {
            rowDistances.push(0); // Distance from a node to itself is 0
          }
        }
        distances.push(rowDistances);
      }

      // Generating the distance matrix
      console.log("Distance Matrix:", distances);
      

      handleSelectAlgorithm();

      if (selectedAlgo === "All") {
        console.log(performance.now());
        const start1 = performance.now();
        const { tour: tourNearest, totalDistance: totalDistanceNearest } =
          solveTSPNearest(distances);
        const end1 = performance.now();

        const start2 = performance.now();
        const { tour: tourBruteForce, totalDistance: totalDistanceBruteForce } =
          solveTSPBruteForce(distances);
        const end2 = performance.now();

        const start3 = performance.now();
        const { tour: tourMST, totalDistance: totalDistanceMST } =
          solveTSPMST(distances);
        const end3 = performance.now();

        // Storing execution times for all algorithms
        setExecutionTimes({
          "TSP Nearest": end1 - start1,
          "TSP Brute Force": end2 - start2,
          "TSP MST": end3 - start3,
        });

        // Storing distances of all algorithms
        const distancesArray = [
          { tour: tourNearest, totalDistance: totalDistanceNearest },
          { tour: tourBruteForce, totalDistance: totalDistanceBruteForce },
          { tour: tourMST, totalDistance: totalDistanceMST },
        ];
        console.log("Distances Array:", distancesArray);

        // Find the shortest distance among the three algorithms
        let shortestDistance = Infinity;
        let shortestDistanceIndex = -1;

        distancesArray.forEach((result, index) => {
          if (result.totalDistance < shortestDistance) {
            shortestDistance = result.totalDistance;
            shortestDistanceIndex = index;
          }
        });

        if (shortestDistanceIndex !== -1) {
          // const { tour, totalDistance } = distancesArray[shortestDistanceIndex];
          const { tour: shortestTour, totalDistance: shortestTotalDistance } =
            distancesArray[shortestDistanceIndex];
          tour = shortestTour; // Assigning to the outer scoped variables
          totalDistance = shortestTotalDistance;
          console.log(executionTimes);
          let shortestAlgorithm =
            Object.keys(executionTimes)[shortestDistanceIndex];
          console.log(shortestAlgorithm);
          setSelectedAlgorithm(shortestAlgorithm);
          setTotalDistance(totalDistance / 1609.34);
        }
      } else {
        if (selectedAlgo === "TSP Nearest") {
          ({ tour, totalDistance } = solveTSPNearest(distances));
        } else if (selectedAlgo === "TSP Brute Force") {
          ({ tour, totalDistance } = solveTSPBruteForce(distances));
        } else if (selectedAlgo === "TSPMST") {
          ({ tour, totalDistance } = solveTSPMST(distances));
        }
      }
      setTourPath(tour);
      setTotalDistance(totalDistance);
      console.log("Tour:", tour);
      console.log("Total distance:", totalDistance / 1609.34);

      // Request directions for the tour path
      if (tour.length >= 2) {
        const directionsService = new window.google.maps.DirectionsService();
        const waypoints = tour.slice(1, tour.length - 1).map((index) => ({
          location: { lat: cities[index].lat, lng: cities[index].lng },
          stopover: true,
        }));

        // Set the origin and destination for the directions request
        const origin = { lat: cities[tour[0]].lat, lng: cities[tour[0]].lng };
        const destination = {
          lat: cities[tour[tour.length - 1]].lat,
          lng: cities[tour[tour.length - 1]].lng,
        };

        // Make the directions request
        directionsService.route(
          {
            origin: origin,
            destination: destination,
            waypoints: waypoints,
            optimizeWaypoints: true,
            travelMode: "DRIVING", // Driving mode
          },
          (result, status) => {
            if (status === "OK") {
              setDirections(result.routes[0].overview_path);

              const totalDuration = result.routes[0].legs.reduce(
                (accumulator, currentLeg) =>
                  accumulator + currentLeg.duration.value,
                0
              );
              setSelectedDuration(totalDuration);
            } else {
              console.error(`Directions request failed due to ${status}`);
            }
          }
        );
      }
      const labeledMarkers = tour.map((cityIndex, index) => {
        const city = cities[cityIndex];
        const markerLabel = index === 0 ? "Start" : (index + 1).toString(); // Label for markers
        const tourNumber = index + 1; // Tour number for the location

        return {
          position: { lat: city.lat, lng: city.lng },
          label: markerLabel,
          title: `Location: ${city.lat}, ${city.lng}`, 
          tourNumber: tourNumber, 
        };
      });


      setMarkersWithLabels(labeledMarkers);
    };

    await calculateDistances();
  };

  const calculateDistance = (service, origin, destination) =>
    new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [origin],
          destinations: [destination],
          travelMode: "DRIVING",
          unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        },
        (response, status) => {
          if (status === "OK") {
            const distance = response.rows[0].elements[0].distance.value;
            resolve(distance);
          } else {
            reject(new Error(`Error: ${status}`));
          }
        }
      );
    });

  const handleDefault = () => {
    const defaultLocation = { lat: 33.8823476, lng: -117.8851033 }; // Set the default location coordinates
    setMapCenter(defaultLocation); // Set the map center to the default location
  };
  const handleRefresh = () => {
    window.location.reload();
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: libraries,
  });

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address) {
        setAddress(place.formatted_address);
        console.log("Valid address");
        setIsValidInput(true);
      } else {
        console.log("Invalid address");
        setIsValidInput(false);
      }
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  return (
    <>
      {landingPage ? (
        <YourReactComponent setLandingPage={setLandingPage}/>
      ) : (
        <div>
          <div className="mainapp">
            <div className="locations">
              <Text fontSize="xl" fontWeight="bold">
                Enter Locations:
              </Text>
              <form onSubmit={handleAddLocation}>
              {/* <form> */}
                <FormControl>
                  <FormLabel>Delivery Location:</FormLabel>
                  <Autocomplete
                    onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                    onPlaceChanged={handlePlaceChanged}
                  >
                    <Input
                      type="text"
                      name="address"
                      style={{ width: "280px" }}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      />
                  </Autocomplete>
                </FormControl>
                <div style={{ padding: "5px" }}>
                  <Button
                    colorScheme="blue"
                    onClick={(e) => handleAddLocation(e)}
                  >
                    Add Location
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={handleDefault}
                    style={{ marginLeft: "5px" }}
                  >
                    Reset Map
                  </Button>
                </div>
              </form>

              <form>
                <Text fontSize="xl" fontWeight="bold">
                  Delivery Locations:
                </Text>
                {deliveryLocations.length > 0 ? (
                  <div
                    className="delivery-box"
                    style={{
                      borderColor: "darkgray",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    <ul>
                      {deliveryLocations.map((location, index) => (
                        <li key={index}>{location}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ul>
                    {deliveryLocations.map((location, index) => (
                      <li key={index}>{location}</li>
                    ))}
                  </ul>
                )}
                {/* <ul>
              {deliveryLocations.map((location, index) => (
                <li key={index}>{location}</li>
              ))}
            </ul> */}
              </form>

              <form onSubmit={handleSubmit} required>
                <FormControl>
                  <FormLabel fontSize="xl" fontWeight="bold">
                    Select an Algorithm:
                  </FormLabel>
                  <select
                    ref={selectAlgoRef}
                    style={{
                      width: "280px",
                      padding: "5px",
                      border: "1px solid black",
                      borderRadius: "5px",
                    }}
                    placeholder="Select an Algorithm "
                    required
                  >
                    <option value="TSP Nearest">TSP Nearest</option>
                    <option value="TSP Brute Force">TSP Brute Force</option>
                    <option value="TSPMST">TSP MST</option>
                    <option value="All">All</option>
                  </select>
                </FormControl>
                <div style={{ padding: "5px" }}>
                  <Button colorScheme="blue" type="submit">
                    Optimize Route
                  </Button>
                  <Button
                    onClick={handleRefresh}
                    colorScheme="red"
                    style={{ marginLeft: "5px" }}
                  >
                    Refresh Page
                  </Button>
                </div>
              </form>

              <div className="tourpath">
                {selectedAlgorithm && (
                  <p>
                    <b>Selected Algorithm: </b> {selectedAlgorithm}
                  </p>
                )}
                {totalDistance && ( // Display distance only when total distance is available
                  <p>
                    <b>Selected Distance:</b>{" "}
                    {(totalDistance / 1609.34).toFixed(2)} miles
                  </p>
                )}
                {selectedDuration && (
                  <p>
                    <b> Estimated Duration: </b>{" "}
                    {Math.floor(selectedDuration / 60)} minutes
                  </p>
                )}
                {/* <h2>
              {" "}
              <b>Tour Path:</b>
            </h2>
            <ul>
              {tourPath.map((index) => (
                <li key={index}>{deliveryLocations[index]}</li>
              ))}
            </ul> */}
                <form>
                  <Text fontSize="xl" fontWeight="bold">
                    Tour Path:
                  </Text>
                  {tourPath.length > 0 ? (
                    <div
                      className="delivery-box"
                      style={{
                        borderColor: "darkgray",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                    >
                      <ul>
                        {tourPath.map((index) => (
                          <li key={index}>{deliveryLocations[index]}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <ul>
                      {tourPath.map((index) => (
                        <li key={index}>{deliveryLocations[index]}</li>
                      ))}
                    </ul>
                  )}
                </form>
              </div>
            </div>

            <div className="map">
              <GoogleMap
                onLoad={(map) => (mapRef.current = map)}
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={15}
              >
                {markers.map((marker, index) => (
                  <Marker
                    key={index}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    options={{
                      icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: marker.isInitial ? "green" : "red", // Set marker color based on isInitial flag
                        fillOpacity: 1,
                        strokeColor: "black",
                        strokeWeight: 2,
                      },
                    }}
                  />
                ))}

                {directions.length > 0 && (
                  <Polyline
                    path={directions.map((point) => ({
                      lat: point.lat(),
                      lng: point.lng(),
                    }))}
                    options={{
                      strokeColor: "#0000FF", // Blue color
                      strokeOpacity: 0.8,
                      strokeWeight: 4,
                    }}
                  />
                )}
              </GoogleMap>
            </div>
          </div>
          {console.log("Ref:", selectAlgoRef)}
          {selectAlgoRef.current?.value === "All" && (
            <div className="graph">
              <Bar
                data={{
                  labels: ["Nearest Neighbor", "TSP BruteForce", "TSPMST"],
                  datasets: [
                    {
                      label: "Execution Time (ms)",
                      data: [
                        executionTimes["TSP Nearest"],
                        executionTimes["TSP Brute Force"],
                        executionTimes["TSP MST"],
                      ],
                      backgroundColor: [
                        "rgba(255, 99, 132, 0.2)",
                        "rgba(54, 162, 235, 0.2)",
                        "rgba(0, 100, 0, 0.2)",
                      ],
                      borderColor: [
                        "rgba(255, 99, 132, 1)",
                        "rgba(54, 162, 235, 1)",
                        "rgba(0, 100, 0, 1)",
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  indexAxis: "x",
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                    },
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default OptimalDeliveryRouteSystem;
