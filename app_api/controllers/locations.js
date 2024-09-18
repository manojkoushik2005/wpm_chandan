const mongoose = require('mongoose');
const Loc = mongoose.model('Location');

const locationsCreate = async (req, res) => {
    try {
        const location = await Loc.create({
            name: req.body.name,
            address: req.body.address,
            facilities: req.body.facilities.split(","),
            coords: {
                type: "Point",
                coordinates: [
                    parseFloat(req.body.lng),
                    parseFloat(req.body.lat)
                ]
            },
            hours: {
                days: req.body.days2,
                opening: req.body.opening2,
                closing: req.body.closing2,
                closed: req.body.closed2,
            }
        });

        res.status(201).json(location);
    } catch (err) {
        res.status(400).json(err);
    }
};


const locationsDeleteOne = (req, res) => {
    const { locationid } = req.params;
    if (locationid) {
        Loc
            .findByIdAndRemove(locationid)
            .exec((err, location) => {
                if (err) {
                    return res
                        .status(404)
                        .json(err);
                }
                res
                    .status(204)
                    .json(null);
            }
            );
    } else {
        res
            .status(404)
            .json({
                "message": "No Location"
            });
    }
};
const locationsUpdateOne = async (req, res) => {
    const locationId = req.params.locationid;

    if (!locationId) {
        return res.status(404).json({
            message: "Not found, locationid is required"
        });
    }

    try {
        const location = await Loc.findById(locationId).select('-reviews -rating').exec();

        if (!location) {
            return res.status(404).json({
                message: "locationid not found"
            });
        }

        // Update location fields
        location.name = req.body.name;
        location.address = req.body.address;
        location.facilities = req.body.facilities.split(',');
        location.coords = {
            type: "Point",
            coordinates: [
                parseFloat(req.body.lng),
                parseFloat(req.body.lat)
            ]
        };
        location.openingTimes = [{
            days: req.body.days1,
            opening: req.body.opening1,
            closing: req.body.closing1,
            closed: req.body.closed1,
        }, {
            days: req.body.days2,
            opening: req.body.opening2,
            closing: req.body.closing2,
            closed: req.body.closed2,
        }];

        // Save the updated location
        const updatedLocation = await location.save();
        res.status(200).json(updatedLocation);

    } catch (err) {
        res.status(400).json(err);
    }
};

const locationsReadOne = async (req, res) => {
    const locationId = req.params.locationid;

    if (!locationId) {
        return res.status(404).json({
            message: "Not found, locationid is required"
        });
    }

    try {
        const location = await Loc.findById(locationId).select('-reviews -rating').exec();

        if (!location) {
            return res.status(404).json({
                message: "locationid not found"
            });
        }

        res.status(200).json(location);
        
    } catch (err) {
        res.status(400).json(err);
    }
};

// const locationsReadOne = (req, res) => {
//     res

//         .status(200)

//         .json({ "status": "success" });
// }
const locationsListByDistance = async (req, res) => {
    const lng = parseFloat(req.query.lng);
    const lat = parseFloat(req.query.lat);
    const near = {
        type: "Point",
        coordinates: [lng, lat]
    };
    const geoOptions = {
        distanceField: "distance.calculated",
        key: 'coords',
        spherical: true,
        maxDistance: 20000,
        limit: 10
    };
    if (!lng || !lat) {
        return res
            .status(404)
            .json({
                "message": "lng and lat query parameters are required"
            });
    }
    try {
        const results = await Loc.aggregate([
            {
                $geoNear: {
                    near,
                    ...geoOptions
                }
            }
        ]);
        const locations = results.map(result => {
            return {
                id: result._id,
                name: result.name,
                address: result.address,
                rating: result.rating,
                facilities: result.facilities,
                distance: `${result.distance.calculated.toFixed()}m`
            }
        });
        res
            .status(200)
            .json(locations);
    } catch (err) {
        res
            .status(404)
            .json(err);
    }
};

module.exports = {
    locationsListByDistance,
    locationsCreate,
    locationsReadOne,
    locationsUpdateOne,
    locationsDeleteOne
};