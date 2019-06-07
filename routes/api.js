const express = require('express');
const router = express.Router();

const DataController = require('../controllers/datatable');

router.get('/datatable', (req,res,next) => {
  DataController.getInitialTable()
      .then(data => {
        res.status(200).json(data);
      })
      .catch(e => {
        res.json({msg: 'fail'});
      });
});

// dev route
router.get('/datatable/:meter', (req,res,next) => {
    DataController.getDataForMeter(req.params.meter)
        .then(data => {
            res.status(200).json(data);
        })
        .catch(e => {
            res.json({msg: 'fail'});
        });
});

module.exports = router;
