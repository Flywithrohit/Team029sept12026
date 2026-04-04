from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models import User, SalesLead, FollowUp
from backend.utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('/leads', methods=['GET'])
@jwt_required()
def get_leads():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if user.role in ['Admin', 'Manager']:
        leads = SalesLead.query.order_by(SalesLead.created_at.desc()).all()
    else:
        leads = SalesLead.query.filter_by(owner_id=current_user_id).order_by(SalesLead.created_at.desc()).all()
    
    result = []
    for lead in leads:
        result.append({
            'id': lead.id,
            'client_company': lead.client_company,
            'contact_person': lead.contact_person,
            'email': lead.email,
            'phone': lead.phone,
            'location': lead.location,
            'website': lead.website,
            'social_links': lead.social_links,
            'spoc_details': lead.spoc_details,
            'status': lead.status,
            'created_at': lead.created_at.strftime('%Y-%m-%d'),
            'owner': lead.owner.full_name if lead.owner else 'Unknown'
        })
    return jsonify(result), 200

@sales_bp.route('/leads', methods=['POST'])
@jwt_required()
def create_lead():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('client_company'):
        return jsonify({'message': 'Client company is required'}), 400

    new_lead = SalesLead(
        owner_id=current_user_id,
        client_company=data.get('client_company'),
        contact_person=data.get('contact_person'),
        email=data.get('email'),
        phone=data.get('phone'),
        location=data.get('location'),
        website=data.get('website'),
        social_links=data.get('social_links'),
        spoc_details=data.get('spoc_details'),
        status='New'
    )
    
    db.session.add(new_lead)
    db.session.commit()
    return jsonify({'message': 'Sales lead created successfully', 'id': new_lead.id}), 201

@sales_bp.route('/leads/<int:id>', methods=['PUT'])
@jwt_required()
def update_lead(id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    lead = SalesLead.query.get_or_404(id)

    if user.role not in ['Admin', 'Manager'] and lead.owner_id != int(current_user_id):
        return jsonify({'message': 'Permission denied'}), 403

    data = request.get_json()
    
    updatable_fields = [
        'client_company',
        'contact_person',
        'email',
        'phone',
        'location',
        'website',
        'social_links',
        'spoc_details',
        'status'
    ]
    for field in updatable_fields:
        if field in data:
            setattr(lead, field, data[field])
        
    db.session.commit()
    return jsonify({'message': 'Sales lead updated successfully'}), 200


@sales_bp.route('/leads/<int:id>', methods=['DELETE'])
@role_required(['Admin'])
def delete_lead(id):
    lead = SalesLead.query.get_or_404(id)
    db.session.delete(lead)
    db.session.commit()
    return jsonify({'message': 'Sales lead deleted successfully'}), 200

@sales_bp.route('/leads/<int:id>/followups', methods=['GET'])
@jwt_required()
def get_followups(id):
    followups = FollowUp.query.filter_by(lead_id=id).order_by(FollowUp.scheduled_at.asc()).all()
    
    result = []
    for fu in followups:
        result.append({
            'id': fu.id,
            'scheduled_at': fu.scheduled_at.strftime('%Y-%m-%d %H:%M'),
            'notes': fu.notes,
            'status': fu.status
        })
    return jsonify(result), 200

@sales_bp.route('/leads/<int:id>/followups', methods=['POST'])
@jwt_required()
def add_followup(id):
    data = request.get_json()
    
    try:
        scheduled_at = datetime.strptime(data.get('scheduled_at'), '%Y-%m-%d %H:%M')
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD HH:MM'}), 400

    new_fu = FollowUp(
        lead_id=id,
        scheduled_at=scheduled_at,
        notes=data.get('notes'),
        status='Pending'
    )
    
    db.session.add(new_fu)
    db.session.commit()
    return jsonify({'message': 'Follow-up scheduled successfully'}), 201

@sales_bp.route('/stats', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_stats():
    total_leads = SalesLead.query.count()
    
    leads = SalesLead.query.all()
    status_counts = {}
    for l in leads:
        status_counts[l.status] = status_counts.get(l.status, 0) + 1
        
    lead_counts = {}
    for l in leads:
        name = l.owner.full_name if l.owner else 'Unknown'
        lead_counts[name] = lead_counts.get(name, 0) + 1

    employee_performance = [
        {'employee_name': name, 'lead_count': count}
        for name, count in sorted(lead_counts.items(), key=lambda item: item[1], reverse=True)
    ]
    
    return jsonify({
        'total_leads': total_leads,
        'status_breakdown': status_counts,
        'employee_performance': employee_performance
    }), 200
