const { User, Charity, Project } = require('../config/database'); 
const { Op } = require('sequelize'); 


const getAllCharities = async (req, res, next) => {
  const { category, location, search, limit = 10, offset = 0 } = req.query;

  const whereConditions = { status: 'approved' }; 

  if (search) {
    whereConditions[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { mission: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  if (category) {
    console.warn('Category filter not fully implemented in current schema.');
    ;
  }
  if (location) {
    console.warn('Location filter not fully implemented in current schema.');
   
  }

  try {
    const { count, rows: charities } = await Charity.findAndCountAll({
      where: whereConditions,
      attributes: [
        'id', 'name', 'mission', 'logo_url', 'raised_amount', 'current_goal',
        'description', 'website', 'contact_email', 'status', 'created_at'
      ],
      order: [['created_at', 'DESC']], 
      limit: parseInt(limit), 
      offset: parseInt(offset), 
    });

    const formattedCharities = charities.map(charity => ({
      id: charity.id,
      name: charity.name,
      mission: charity.mission,
      logoUrl: charity.logo_url,
      raisedAmount: parseFloat(charity.raised_amount), 
      currentGoal: parseFloat(charity.current_goal),   
      description: charity.description,
      website: charity.website,
      contactEmail: charity.contact_email,
      status: charity.status,
      createdAt: charity.created_at,
    }));

    res.json({
      charities: formattedCharities,
      total: count, 
    });
  } catch (error) {
    console.error('Error fetching charities:', error.message);
    next(new Error('Server error fetching charities.'));
  }
};


const getCharityProfile = async (req, res, next) => {
  const charityId = req.params.id;

  try {
    const charity = await Charity.findOne({
      where: { id: charityId, status: 'approved' }, 
      attributes: [
        'id', 'name', 'registration_number', 'mission', 'description',
        'website', 'contact_email', 'logo_url', 'status',
        'current_goal', 'raised_amount', 'created_at', 'updated_at'
      ],
    });

    if (!charity) {
      const error = new Error('Charity not found or not approved.');
      error.statusCode = 404;
      return next(error);
    }

    res.json({
      id: charity.id,
      name: charity.name,
      registrationNumber: charity.registration_number,
      mission: charity.mission,
      description: charity.description,
      website: charity.website,
      contactEmail: charity.contact_email,
      logoUrl: charity.logo_url,
      status: charity.status,
      currentGoal: parseFloat(charity.current_goal),
      raisedAmount: parseFloat(charity.raised_amount),
      createdAt: charity.created_at,
      updatedAt: charity.updated_at,
    });
  } catch (error) {
    console.error('Error fetching charity profile:', error.message);
    next(new Error('Server error fetching charity profile.'));
  }
};


const updateCharityProfile = async (req, res, next) => {

  const charityId = req.user.charityId;
  const { name, mission, description, website, contactEmail, logoUrl } = req.body;

  if (!charityId) {
    const error = new Error('Not authorized to update charity profile.');
    error.statusCode = 403;
    return next(error);
  }

  try {
    const charity = await Charity.findByPk(charityId);

    if (!charity) {
      const error = new Error('Charity profile not found.');
      error.statusCode = 404;
      return next(error);
    }

    charity.name = name !== undefined ? name : charity.name;
    charity.mission = mission !== undefined ? mission : charity.mission;
    charity.description = description !== undefined ? description : charity.description;
    charity.website = website !== undefined ? website : charity.website;
    charity.contact_email = contactEmail !== undefined ? contactEmail : charity.contact_email;
    charity.logo_url = logoUrl !== undefined ? logoUrl : charity.logo_url;

    await charity.save(); 

    res.json({
      message: 'Charity profile updated successfully.',
      charity: {
        id: charity.id,
        name: charity.name,
        mission: charity.mission,
        website: charity.website,
        contactEmail: charity.contact_email,
        logoUrl: charity.logo_url,
        updatedAt: charity.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating charity profile:', error.message);
    next(new Error('Server error updating charity profile.'));
  }
};


const addCharityProject = async (req, res, next) => {
  const charityId = req.user.charityId;
  const { title, description, goalAmount, startDate, endDate, imageUrl } = req.body;

  if (!charityId) {
    const error = new Error('Not authorized to add projects.');
    error.statusCode = 403;
    return next(error);
  }
  if (!title || !goalAmount) {
    const error = new Error('Project title and goal amount are required.');
    error.statusCode = 400;
    return next(error);
  }
  if (typeof goalAmount !== 'number' || goalAmount <= 0) {
    const error = new Error('Invalid goal amount. Must be a positive number.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const project = await Project.create({
      charity_id: charityId,
      title,
      description: description || null,
      goal_amount: goalAmount,
      start_date: startDate || null,
      end_date: endDate || null,
      image_url: imageUrl || null,
    });

    res.status(201).json({
      message: 'Project added successfully.',
      project: {
        id: project.id,
        charityId: project.charity_id,
        title: project.title,
        description: project.description,
        goalAmount: parseFloat(project.goal_amount),
        raisedAmount: parseFloat(project.raised_amount),
        startDate: project.start_date,
        endDate: project.end_date,
        imageUrl: project.image_url,
        createdAt: project.created_at,
      },
    });
  } catch (error) {
    console.error('Error adding charity project:', error.message);
    next(new Error('Server error adding project.'));
  }
};


const getCharityProjects = async (req, res, next) => {
  const charityId = req.params.id;

  try {
    const charityExists = await Charity.findOne({ where: { id: charityId, status: 'approved' } });
    if (!charityExists) {
      const error = new Error('Charity not found or not approved.');
      error.statusCode = 404;
      return next(error);
    }

    const projects = await Project.findAll({
      where: { charity_id: charityId },
      attributes: [
        'id', 'charity_id', 'title', 'description', 'goal_amount', 'raised_amount',
        'start_date', 'end_date', 'image_url', 'created_at'
      ],
      order: [['created_at', 'DESC']],
    });

    const formattedProjects = projects.map(project => ({
      id: project.id,
      charityId: project.charity_id,
      title: project.title,
      description: project.description,
      goalAmount: parseFloat(project.goal_amount),
      raisedAmount: parseFloat(project.raised_amount),
      startDate: project.start_date,
      endDate: project.end_date,
      imageUrl: project.image_url,
      createdAt: project.created_at,
    }));

    res.json({ projects: formattedProjects });
  } catch (error) {
    console.error('Error fetching charity projects:', error.message);
    next(new Error('Server error fetching projects.'));
  }
};


const setCharityGoal = async (req, res, next) => {
  const charityId = req.user.charityId; 
  const { goalAmount } = req.body;

  if (!charityId) {
    const error = new Error('Not authorized to set goals.');
    error.statusCode = 403;
    return next(error);
  }
  if (typeof goalAmount !== 'number' || goalAmount <= 0) {
    const error = new Error('Invalid goal amount. Must be a positive number.');
    error.statusCode = 400;
    return next(error);
  }

  try {
    const charity = await Charity.findByPk(charityId);

    if (!charity) {
      const error = new Error('Charity not found.');
      error.statusCode = 404;
      return next(error);
    }

    charity.current_goal = goalAmount; 
    await charity.save();

    res.json({
      message: 'Charity overall donation goal updated successfully.',
      charity: {
        id: charity.id,
        currentGoal: parseFloat(charity.current_goal),
        raisedAmount: parseFloat(charity.raised_amount),
        updatedAt: charity.updated_at,
      },
    });
  } catch (error) {
    console.error('Error setting charity goal:', error.message);
    next(new Error('Server error setting charity goal.'));
  }
};

module.exports = {
  getAllCharities,
  getCharityProfile,
  updateCharityProfile,
  addCharityProject,
  getCharityProjects,
  setCharityGoal,
};